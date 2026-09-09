# SmartApiAnalyzer
---

## 1. High-level purpose

SmartApiAnalyzer is a multi-project C# application that ingests API log signals (endpoint + status + latency), publishes them into an in-memory event pipeline, and triggers a **coordinator-driven agent pipeline**.

The pipeline is designed around a **constraints system** implemented via the first (“gatekeeper”) agent:

- Validate the input URL (format + scheme constraints)
- Run threat intelligence checks (block suspicious targets)
- Discover reachable endpoints (probe routes)
- Normalize route outputs and infer likely supported HTTP methods
- Then conditionally execute downstream agents (stop early when the gatekeeper decides)

---

## 2. Repository structure (bounded contexts)

This solution is organized into four .NET projects:

### `SmartApiAnalyzer.Api`
- ASP.NET Core Web API.
- Exposes HTTP endpoints for ingestion and retrieval.
- Wires controllers + Swagger.

### `SmartApiAnalyzer.Application`
- Application services (use-cases) and DTOs.
- Defines and implements interfaces used by the rest of the system.

### `SmartApiAnalyzer.Domain`
- Domain entities/events/models.
- Contains event types and core data structures.

### `SmartApiAnalyzer.Infrastructure`
- Infrastructure implementations:
  - Agent implementations (`IAgent`)
  - Agent registry and coordination
  - Background worker and in-memory queue/bus
  - Repositories (in-memory placeholders / stubs depending on file)

---

## 3. Runtime architecture (event-driven agent pipeline)

### 3.1 Ingestion entrypoint

**HTTP Controller**: `SmartApiAnalyzer.Api/Controllers/LogsController.cs`

- `POST /api/v1/logs/ingest`
  - Accepts a log ingestion request DTO (`IngestLogRequest`).
  - Calls `ILogService.IngestAsync(request)`.
  - If ingestion succeeds returns HTTP `202 Accepted`.

### 3.2 Ingest service publishes a domain event

**Service**: `SmartApiAnalyzer.Application/Services/LogService.cs`

- `IngestAsync(LogSchema.IngestLogRequest request)` creates a `LogResponse` model containing:
  - `Id` (new GUID)
  - `Endpoint`
  - `StatusCode`
  - `ResponseTimeMs`
  - `Timestamp`
- Then publishes a `LogIngestedEvent` using `IEventBus.PublishAsync(...)`.

> Important: `GetAllAsync()` and `GetByIdAsync()` currently throw `NotImplementedException`.

### 3.3 Background worker dequeues events and invokes the coordinator

**Background service**: `SmartApiAnalyzer.Infrastructure/BackgroundJobs/LogProcessingWorker.cs`

Loop:
1. Waits on `IEventQueue.DequeueAsync(stoppingToken)`
2. Creates a scoped DI container
3. Retrieves:
   - `IRealtimeNotifier`
   - `ICoordinator`
4. Notifies realtime: “New log received; processing started”
5. Calls `ICoordinator.RunAsync(evt, stoppingToken)`

### 3.4 Coordinator runs the constraints system

**Coordinator**: `SmartApiAnalyzer.Infrastructure/coordination/AgentCoordinator.cs`

`RunAsync(LogIngestedEvent evt, CancellationToken ct)`:
1. Retrieves the **gatekeeper agent** from the registry by agent type:
   - `AgentType.UrlValidationAndEndpoints`
2. Executes that agent:
   - `validation.ExecuteAsync(evt, ct)`
3. Sends the agent result message to realtime notifier.
4. If the gatekeeper returns `StopProcessing == true`:
   - coordinator returns immediately (hard constraint stop)
5. Otherwise:
   - coordinator selects downstream agents
   - executes them sequentially until one requests `StopProcessing`.

Key semantics:
- The gatekeeper is the first agent.
- Downstream agents run only if validation passes.
- Pipeline supports short-circuiting when `AgentResult.StopProcessing` is set.

Resume path exists:
- `ResumeAsync(Guid sessionId, ApprovalRequest request, ...)`
- Creates a `LogIngestedEvent` with `ApprovedRoutes` and executes agents again.

---

## 4. The constraints system (agent pipeline contract)

The constraints system is implemented primarily by:

- **`UrlValidationAndEndpointGeneration_Agent`** (Priority = 1)
- Coordinator stop/resume behavior

### 4.1 Stop-processing as the primary constraint enforcement

- Each agent returns an `AgentResult`.
- Coordinator checks `result.StopProcessing`.
- If true, coordinator halts execution.

This means constraints are not enforced by a separate policy engine; they are enforced through the **agent return contract**.

### 4.2 Gatekeeper responsibilities

**Gatekeeper agent**: `SmartApiAnalyzer.Infrastructure/Agents/security/UrlValidationAndEndpointGeneration_Agent.cs`

Primary responsibilities (as implemented):

1. **Input validation**
   - Requires `evt.Endpoint` to be non-empty
   - Requires an absolute URI
   - Requires scheme to be HTTP or HTTPS only

2. **Threat intelligence scan**
   - Calls `_threatIntel.AnalyzeAsync(uri, ct)`
   - Blocks downstream processing when `threatResult.IsMalicious == true`

3. **Endpoint discovery**
   - Calls `_endpointDiscovery.DiscoverAsync(uri, ct)`
   - Ensures route list contains at least `/`

4. **Route normalization and method inference**
   - Normalizes endpoints:
     - ensures leading `/`
     - lowercases
   - Infers likely HTTP methods using a heuristic based on route content:
     - always includes: GET, HEAD, OPTIONS
     - if route contains create/register/login → add POST
     - if route looks like IDs ("{id}" or any digit) → add PUT, PATCH, DELETE

5. **Builds a structured payload**
   - Produces an object/dictionary containing:
     - `BaseUrl`, `Host`, `Scheme`, `Port`
     - `Endpoints`: list of `{ Route, Methods }`
     - `EndpointCount`
     - `ThreatScore`
     - `Safe` (true when gatekeeper succeeds)

If a constraint fails, the agent returns a **critical stop** result:
- The coordinator treats it as an early termination condition.

---

## 5. Agent framework (how to extend)

### 5.1 Core interfaces

From application layer interfaces:
- `IAgent`
  - Has at least:
    - `Name` (string)
    - `Priority` (int)
    - `ExecuteAsync(LogIngestedEvent evt, CancellationToken ct)` returning `AgentResult`

- `IAgentRegistry`
  - `Get(agentName)`
  - `GetAll()`

- `IAgentSelector`
  - `Select(evt, agents)`

- `ICoordinator`
  - `RunAsync(evt, ct)`
  - `ResumeAsync(sessionId, request, ct)`

### 5.2 Registry

**`SmartApiAnalyzer.Infrastructure/Agents/facrtory/AgentRegistry.cs`**

- Builds a dictionary of `IAgent` by agent name.
- `Get(agentName)` throws if agent is missing.

### 5.3 Selection (current limitation)

**`SmartApiAnalyzer.Application/Services/Agents/AgentSelector.cs`**

- `Select(LogIngestedEvent evt, IEnumerable<IAgent> agents)` currently throws `NotImplementedException()`.

Implication:
- In the current code state, downstream agent selection is not functional.
- The gatekeeper agent execution path can still be understood and reasoned about.

---

## 6. Detailed documentation of critical services

### 6.1 Threat intelligence scoring

**`SmartApiAnalyzer.Application/Services/Agents/ThreatIntelService.cs`**

Method: `AnalyzeAsync(Uri target, CancellationToken ct)`

Scoring model:
- **Suspicious domain patterns** (+30)
  - If host contains any of:
    - `login`, `secure`, `verify`, `update-account`, `bank`

- **DNS resolution / IP checks**
  - If DNS returns no IPs (+40) with reason “Domain does not resolve to IP”
  - If any IP is:
    - loopback (+80) with reason “Loopback address detected”
    - private/internal (+20) with reason “Private/internal IP detected”

- **Protocol risk**
  - If scheme is `http` (+10) with reason “Unencrypted HTTP usage”

Classification threshold:
- `MALICIOUS_THRESHOLD = 70`
- `IsMalicious = score >= 70`

Output:
- `ThreatAnalysisResult { IsMalicious, Score, Reason[], Category? }`

### 6.2 Endpoint discovery probing

There are two relevant components:

#### (a) Discovery service

**`SmartApiAnalyzer.Application/Services/Agents/EndpointDiscoveryService.cs`**

- Maintains `CommonEndpoints` (currently empty array literal in code).
- `DiscoverAsync(baseUri, ct)`:
  1. Iterates over `CommonEndpoints`
  2. For each endpoint:
     - constructs `fullUrl = new Uri(baseUri, endpoint)`
     - sends a `HEAD` request
     - considers endpoints found if response is:
       - success OR
       - `MethodNotAllowed`
     - ignores exceptions (robust probing)
  3. Ensures `/` exists in the returned list.
  4. Returns distinct endpoints.

#### (b) Gatekeeper uses discovery results

The gatekeeper normalizes each discovered route and adds methods.

> Note: because `CommonEndpoints` is empty in this code snapshot, discovery will likely only return `/`.

---

## 7. Dependency injection and wiring (what runs)

**`SmartApiAnalyzer.Api/Program.cs`** contains DI wiring that matters for architecture understanding:

- Registers:
  - Controllers
  - FluentValidation
  - Application services: `ILogService`, `IMetricsService`, `ISubscriptionService`, `IMetricProcessor`
  - Repository: `ILogRepository`
  - Event system:
    - `IEventQueue` → `InMemoryEventQueue`
    - `IEventBus` → `InMemoryEventBus`
  - Realtime and agent infrastructure:
    - `IRealtimeNotifier` → `RealtimeNotifier`
    - `IAgentRegistry` → `AgentRegistry`
    - `ICoordinator` → `AgentCoordinator`
  - Agents:
    - multiple `IAgent` registrations including:
      - `UrlValidationAndEndpointGeneration_Agent`
      - `SecurityHeaders_Agent`
      - `LatencyPerformance_Agent`
      - `Metrics_Agent`
      - etc.
  - Background worker:
    - `LogProcessingWorker`

---

## 8. Key limitations / current TODOs (important for AI reasoning)

These are functional gaps revealed by code:

1. **`AgentSelector.Select` is not implemented**
   - Downstream agent selection will fail.

2. **`EndpointDiscoveryService.CommonEndpoints` is empty**
   - Discovery results will default to `/`.

3. **`LogService.GetAllAsync` and `GetByIdAsync` are not implemented**
   - Reads for logs are currently unavailable.

These constraints should be treated as “current-state” facts when reasoning about execution.

---

## 9. How to understand/extend the system (agent-centric)

If you add an agent:
1. Implement `IAgent` in `Infrastructure/Agents/...`.
2. Give it a unique `Name` (aligned with `AgentTypeExtensions.ToSystemName()` naming scheme used elsewhere).
3. Ensure it cooperates with the coordinator stop semantics (return `AgentResult.StopProcessing` when needed).
4. Update `Program.cs` to register the agent in DI.
5. Update/implement `AgentSelector.Select` so the coordinator can choose it.

If you add new constraints:
- Prefer updating the gatekeeper agent first.
- Or implement a new gatekeeper-like agent and adjust coordinator order/selection rules.

---

## 10. Summary: “constraints system” in one paragraph

SmartApiAnalyzer enforces the constraints system through a first-pass agent (`UrlValidationAndEndpointGeneration_Agent`) that validates URL format and scheme, runs a heuristic threat intelligence scoring (`ThreatIntelService`), probes common endpoints (`EndpointDiscoveryService`), and returns either a “safe” payload enabling downstream work or a critical stop result that prevents further agents from executing. The coordinator (`AgentCoordinator`) applies these decisions by short-circuiting on `AgentResult.StopProcessing` and supports resuming sessions via approval input.

