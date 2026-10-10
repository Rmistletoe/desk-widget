namespace DeskWidget.Models;

public class StickyNote
{
    public string Id { get; set; } = "main-note";
    public string Content { get; set; } = "【随手备忘】\n点击这里随手记录灵感、待办或备忘事项。\n打字实时自动保存，随时关闭不丢数据。";
    public string Color { get; set; } = "yellow"; // yellow, green, pink, blue, white
    public long UpdatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
}
