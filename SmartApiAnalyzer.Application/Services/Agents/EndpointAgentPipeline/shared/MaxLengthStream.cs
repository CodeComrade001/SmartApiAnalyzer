// SmartApiAnalyzer.Infrastructure/Agents/EndpointDiscovery/Shared/MaxLengthStream.cs
namespace SmartApiAnalyzer.Infrastructure.Agents.EndpointDiscovery.Shared;

/// <summary>
/// Wraps a stream to cap total bytes read, protecting discovery strategies from
/// unbounded downloads (e.g. a target serving an intentionally huge HTML/JS payload).
/// </summary>
internal sealed class MaxLengthStream(Stream inner, long maxBytes) : Stream
{
  private long _bytesRead;

  public override int Read(byte[] buffer, int offset, int count)
  {
    if (_bytesRead >= maxBytes) return 0;
    var allowed = (int)Math.Min(count, maxBytes - _bytesRead);
    var read = inner.Read(buffer, offset, allowed);
    _bytesRead += read;
    return read;
  }

  public override async Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken)
  {
    if (_bytesRead >= maxBytes) return 0;
    var allowed = (int)Math.Min(count, maxBytes - _bytesRead);
    var read = await inner.ReadAsync(buffer.AsMemory(offset, allowed), cancellationToken);
    _bytesRead += read;
    return read;
  }

  public override bool CanRead => true;
  public override bool CanSeek => false;
  public override bool CanWrite => false;
  public override long Length => throw new NotSupportedException();
  public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }
  public override void Flush() { }
  public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
  public override void SetLength(long value) => throw new NotSupportedException();
  public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
}