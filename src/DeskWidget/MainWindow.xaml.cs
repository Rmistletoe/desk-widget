using System.Drawing;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Threading;
using DeskWidget.Services;
using DeskWidget.ViewModels;
using Forms = System.Windows.Forms;

namespace DeskWidget;

public partial class MainWindow : Window
{
    private HotkeyService? _hotkeyService;
    private Forms.NotifyIcon? _notifyIcon;
    private readonly DispatcherTimer _noteSaveDebounceTimer;

    public MainWindow()
    {
        App.Log("MainWindow ctor start");
        // 关键：必须在 InitializeComponent 之前先构造定时器，防止 XAML 初次绑定 TextChanged 时发生空引用
        _noteSaveDebounceTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromMilliseconds(400)
        };
        _noteSaveDebounceTimer.Tick += (_, _) =>
        {
            _noteSaveDebounceTimer.Stop();
            ViewModel?.SaveAllData();
        };

        App.Log("Calling InitializeComponent...");
        InitializeComponent();
        App.Log("InitializeComponent completed");

        Loaded += OnWindowLoaded;
        Closing += OnWindowClosing;

        InitializeTray();
        App.Log("InitializeTray completed");
    }

    private void OnWindowLoaded(object sender, RoutedEventArgs e)
    {
        App.Log("OnWindowLoaded triggered");
        // 定位在主显示屏右上角 (贴边留出 30px 空隙)
        var workArea = SystemParameters.WorkArea;
        Left = workArea.Right - Width - 30;
        Top = 80;

        App.Log($"Window positioned at Left={Left}, Top={Top}, Visibility={Visibility}");

        // 注册全局老板键 Alt+Shift+H
        _hotkeyService = new HotkeyService(this, ToggleVisibility);
        App.Log("Hotkey registered");
    }

    private void InitializeTray()
    {
        _notifyIcon = new Forms.NotifyIcon
        {
            Text = "桌面便签挂件",
            Visible = true,
            Icon = SystemIcons.Application
        };

        // 单击托盘图标切换显隐
        _notifyIcon.Click += (_, e) =>
        {
            if (e is Forms.MouseEventArgs mouseEvent && mouseEvent.Button == Forms.MouseButtons.Left)
            {
                ToggleVisibility();
            }
        };

        // 托盘右键菜单
        var contextMenu = new Forms.ContextMenuStrip();
        contextMenu.Items.Add("📌 显示/隐藏便签", null, (_, _) => ToggleVisibility());
        contextMenu.Items.Add(new Forms.ToolStripSeparator());
        contextMenu.Items.Add("❌ 退出程序", null, (_, _) =>
        {
            _notifyIcon.Visible = false;
            _notifyIcon.Dispose();
            Forms.Application.Exit();
            System.Windows.Application.Current.Shutdown();
        });

        _notifyIcon.ContextMenuStrip = contextMenu;
    }

    public void ToggleVisibility()
    {
        if (Visibility == Visibility.Visible)
        {
            Hide();
        }
        else
        {
            Show();
            Activate();
        }
    }

    private void OnWindowDragMove(object sender, MouseButtonEventArgs e)
    {
        if (e.ClickCount == 2)
        {
            ViewModel?.ToggleCapsuleCommand.Execute(null);
            AdjustWindowHeight();
            return;
        }

        if (e.LeftButton == MouseButtonState.Pressed)
        {
            DragMove();
        }
    }

    private void AdjustWindowHeight()
    {
        if (ViewModel == null) return;
        Height = ViewModel.IsCapsuleMode ? 54 : 490;
    }

    private void OnToggleAlwaysOnTopClick(object sender, RoutedEventArgs e)
    {
        if (ViewModel == null) return;
        ViewModel.Config.AlwaysOnTop = !ViewModel.Config.AlwaysOnTop;
        ViewModel.SaveSettingsCommand.Execute(null);
    }

    private void OnSwitchToTodoClick(object sender, RoutedEventArgs e)
    {
        TodoViewPanel.Visibility = Visibility.Visible;
        NoteViewPanel.Visibility = Visibility.Collapsed;
        if (ViewModel != null) ViewModel.ActiveTab = "todo";
    }

    private void OnSwitchToNoteClick(object sender, RoutedEventArgs e)
    {
        TodoViewPanel.Visibility = Visibility.Collapsed;
        NoteViewPanel.Visibility = Visibility.Visible;
        if (ViewModel != null) ViewModel.ActiveTab = "note";
    }

    private void OnTodoInputKeyDown(object sender, System.Windows.Input.KeyEventArgs e)
    {
        if (e.Key == System.Windows.Input.Key.Enter)
        {
            ViewModel?.AddTodoCommand.Execute(null);
        }
    }

    private void OnQuickAddTagClick(object sender, RoutedEventArgs e)
    {
        if (sender is System.Windows.Controls.Button btn && btn.Content is string tag && ViewModel != null)
        {
            ViewModel.NewTodoText = $"{tag} ";
            TodoInputBox.Focus();
            TodoInputBox.CaretIndex = TodoInputBox.Text.Length;
        }
    }

    private void OnNoteTextChanged(object sender, TextChangedEventArgs e)
    {
        _noteSaveDebounceTimer?.Stop();
        _noteSaveDebounceTimer?.Start();
    }

    private void OnWindowClosing(object? sender, System.ComponentModel.CancelEventArgs e)
    {
        _hotkeyService?.Dispose();
        if (_notifyIcon != null)
        {
            _notifyIcon.Visible = false;
            _notifyIcon.Dispose();
        }
    }
}