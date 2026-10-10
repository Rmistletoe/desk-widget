using CommunityToolkit.Mvvm.ComponentModel;

namespace DeskWidget.Models;

public partial class TodoItem : ObservableObject
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [ObservableProperty]
    private string text = string.Empty;

    [ObservableProperty]
    private bool isCompleted;

    [ObservableProperty]
    private string priority = "normal"; // normal, important

    public long CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
}
