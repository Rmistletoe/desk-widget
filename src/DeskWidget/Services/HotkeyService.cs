using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;

namespace DeskWidget.Services;

public class HotkeyService : IDisposable
{
    private const int WM_HOTKEY = 0x0312;
    private const int HOTKEY_ID = 9001;

    // MOD_ALT = 0x0001, MOD_SHIFT = 0x0004 => 0x0005
    private const uint MOD_ALT_SHIFT = 0x0001 | 0x0004;
    private const uint VK_H = 0x48;

    private HwndSource? _source;
    private readonly Window _window;
    private readonly Action _onHotkeyPressed;

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

    public HotkeyService(Window window, Action onHotkeyPressed)
    {
        _window = window;
        _onHotkeyPressed = onHotkeyPressed;

        if (_window.IsLoaded)
        {
            Initialize();
        }
        else
        {
            _window.Loaded += (_, _) => Initialize();
        }
    }

    private void Initialize()
    {
        var handle = new WindowInteropHelper(_window).Handle;
        _source = HwndSource.FromHwnd(handle);
        _source?.AddHook(HwndHook);

        RegisterHotKey(handle, HOTKEY_ID, MOD_ALT_SHIFT, VK_H);
    }

    private IntPtr HwndHook(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (msg == WM_HOTKEY && wParam.ToInt32() == HOTKEY_ID)
        {
            _onHotkeyPressed.Invoke();
            handled = true;
        }
        return IntPtr.Zero;
    }

    public void Dispose()
    {
        var handle = new WindowInteropHelper(_window).Handle;
        UnregisterHotKey(handle, HOTKEY_ID);
        _source?.RemoveHook(HwndHook);
    }
}
