using System.IO;
using System.Windows.Threading;
using WpfApp = System.Windows.Application;

namespace DeskWidget;

/// <summary>
/// Interaction logic for App.xaml
/// </summary>
public partial class App : WpfApp
{
    public App()
    {
        AppDomain.CurrentDomain.UnhandledException += (s, args) =>
        {
            Log("AppDomain Unhandled: " + args.ExceptionObject);
        };

        DispatcherUnhandledException += (s, args) =>
        {
            Log("Dispatcher Unhandled: " + args.Exception);
        };
    }

    protected override void OnStartup(System.Windows.StartupEventArgs e)
    {
        Log("App OnStartup enter");
        base.OnStartup(e);
        Log("App OnStartup base finished");
    }

    public static void Log(string msg)
    {
        try
        {
            var logPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app.log");
            File.AppendAllText(logPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] {msg}\r\n");
        }
        catch { }
    }
}
