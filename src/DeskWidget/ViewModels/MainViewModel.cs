using System.Collections.ObjectModel;
using System.Windows.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using DeskWidget.Models;
using DeskWidget.Services;

namespace DeskWidget.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly StorageService _storageService;
    private readonly DispatcherTimer _timer;

    [ObservableProperty]
    private AppConfig _config;

    [ObservableProperty]
    private ObservableCollection<TodoItem> _todos = new();

    [ObservableProperty]
    private string _noteContent = string.Empty;

    [ObservableProperty]
    private string _noteColor = "yellow";

    [ObservableProperty]
    private string _newTodoText = string.Empty;

    [ObservableProperty]
    private string _activeTab = "todo"; // todo, note

    [ObservableProperty]
    private bool _isCapsuleMode = false;

    [ObservableProperty]
    private bool _isSettingsOpen = false;

    [ObservableProperty]
    private string _paydayText = "距发薪 -- 天";

    [ObservableProperty]
    private string _countdownText = "距下班 00:00:00";

    [ObservableProperty]
    private int _workProgressPercent = 0;

    [ObservableProperty]
    private string _currentGreeting = string.Empty;

    public int UncompletedTodoCount => Todos.Count(t => !t.IsCompleted);

    public MainViewModel()
    {
        _storageService = new StorageService();
        _config = _storageService.LoadConfig();

        var data = _storageService.LoadData();
        foreach (var item in data.Todos)
        {
            item.PropertyChanged += (_, _) => OnTodoItemChanged();
            _todos.Add(item);
        }

        _noteContent = data.Note.Content;
        _noteColor = data.Note.Color;
        _currentGreeting = _config.CustomMessage;

        UpdateCountdowns();

        _timer = new DispatcherTimer
        {
            Interval = TimeSpan.FromSeconds(1)
        };
        _timer.Tick += (_, _) => UpdateCountdowns();
        _timer.Start();
    }

    private void UpdateCountdowns()
    {
        var now = DateTime.Now;

        // 1. 发薪日计算
        var payday = Math.Clamp(Config.Payday, 1, 31);
        if (now.Day == payday)
        {
            PaydayText = "今天发薪日！💰";
        }
        else
        {
            DateTime targetPayday;
            if (now.Day < payday)
            {
                var daysInMonth = DateTime.DaysInMonth(now.Year, now.Month);
                var actualDay = Math.Min(payday, daysInMonth);
                targetPayday = new DateTime(now.Year, now.Month, actualDay);
            }
            else
            {
                var nextMonth = now.AddMonths(1);
                var daysInNextMonth = DateTime.DaysInMonth(nextMonth.Year, nextMonth.Month);
                var actualDay = Math.Min(payday, daysInNextMonth);
                targetPayday = new DateTime(nextMonth.Year, nextMonth.Month, actualDay);
            }
            var diff = (targetPayday.Date - now.Date).Days;
            PaydayText = $"距发薪 {diff} 天";
        }

        // 2. 作息与工时进度计算
        if (TimeSpan.TryParse(Config.WorkStartTime, out var startTime) &&
            TimeSpan.TryParse(Config.WorkEndTime, out var endTime))
        {
            var start = now.Date.Add(startTime);
            var end = now.Date.Add(endTime);

            if (now < start)
            {
                var remaining = start - now;
                CountdownText = $"距上班 {(int)remaining.TotalHours}时{remaining.Minutes}分";
                WorkProgressPercent = 0;
            }
            else if (now >= end)
            {
                CountdownText = "下班时间到！准时撤退 🎉";
                WorkProgressPercent = 100;
            }
            else
            {
                var totalDuration = (end - start).TotalSeconds;
                var elapsed = (now - start).TotalSeconds;
                WorkProgressPercent = (int)Math.Clamp((elapsed / totalDuration) * 100, 0, 100);

                var remaining = end - now;
                CountdownText = $"距下班 {remaining.Hours:D2}:{remaining.Minutes:D2}:{remaining.Seconds:D2}";
            }
        }
    }

    [RelayCommand]
    private void AddTodo()
    {
        if (string.IsNullOrWhiteSpace(NewTodoText)) return;

        var item = new TodoItem
        {
            Text = NewTodoText.Trim(),
            Priority = "normal"
        };
        item.PropertyChanged += (_, _) => OnTodoItemChanged();
        Todos.Insert(0, item);
        NewTodoText = string.Empty;
        OnPropertyChanged(nameof(UncompletedTodoCount));
        SaveAllData();
    }

    [RelayCommand]
    private void QuickAdd(string text)
    {
        NewTodoText = text;
    }

    [RelayCommand]
    private void DeleteTodo(TodoItem item)
    {
        if (Todos.Remove(item))
        {
            OnPropertyChanged(nameof(UncompletedTodoCount));
            SaveAllData();
        }
    }

    [RelayCommand]
    private void ClearCompletedTodos()
    {
        var completed = Todos.Where(t => t.IsCompleted).ToList();
        foreach (var item in completed)
        {
            Todos.Remove(item);
        }
        OnPropertyChanged(nameof(UncompletedTodoCount));
        SaveAllData();
    }

    [RelayCommand]
    private void SetNoteColor(string color)
    {
        NoteColor = color;
        SaveAllData();
    }

    [RelayCommand]
    private void ToggleCapsule()
    {
        IsCapsuleMode = !IsCapsuleMode;
    }

    [RelayCommand]
    private void ToggleSettings()
    {
        IsSettingsOpen = !IsSettingsOpen;
    }

    [RelayCommand]
    private void SaveSettings()
    {
        _storageService.SaveConfig(Config);
        CurrentGreeting = Config.CustomMessage;
        UpdateCountdowns();
        IsSettingsOpen = false;
    }

    public void OnNoteContentChanged()
    {
        SaveAllData();
    }

    private void OnTodoItemChanged()
    {
        OnPropertyChanged(nameof(UncompletedTodoCount));
        SaveAllData();
    }

    public void SaveAllData()
    {
        _storageService.SaveData(new AppData
        {
            Todos = Todos.ToList(),
            Note = new StickyNote
            {
                Content = NoteContent,
                Color = NoteColor,
                UpdatedAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            }
        });
    }
}
