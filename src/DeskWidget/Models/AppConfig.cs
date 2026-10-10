namespace DeskWidget.Models;

public class AppConfig
{
    public string WorkStartTime { get; set; } = "09:00";
    public string WorkEndTime { get; set; } = "18:00";
    public int Payday { get; set; } = 15;
    public bool AlwaysOnTop { get; set; } = true;
    public double Opacity { get; set; } = 0.95;
    public string CustomMessage { get; set; } = "今天也要保持好心情，下班一起吃好吃的～";
}
