namespace DeskWidget.Models;

public class AppData
{
    public List<TodoItem> Todos { get; set; } = new()
    {
        new TodoItem { Text = "完成今日重点任务", Priority = "important" },
        new TodoItem { Text = "下班准时打卡撤退 🎉", Priority = "normal" }
    };

    public StickyNote Note { get; set; } = new();
}
