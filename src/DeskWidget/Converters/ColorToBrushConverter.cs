using System.Globalization;
using System.Windows.Data;
using System.Windows.Media;

namespace DeskWidget.Converters;

public class ColorToBrushConverter : IValueConverter
{
    private static readonly Dictionary<string, SolidColorBrush> BrushMap = new()
    {
        ["yellow"] = new SolidColorBrush(System.Windows.Media.Color.FromRgb(0xFF, 0xF8, 0xE1)),
        ["green"] = new SolidColorBrush(System.Windows.Media.Color.FromRgb(0xE8, 0xF5, 0xE9)),
        ["pink"] = new SolidColorBrush(System.Windows.Media.Color.FromRgb(0xFC, 0xE4, 0xEC)),
        ["blue"] = new SolidColorBrush(System.Windows.Media.Color.FromRgb(0xE1, 0xF5, 0xFE)),
        ["white"] = new SolidColorBrush(System.Windows.Media.Color.FromRgb(0xF5, 0xF5, 0xF7)),
    };

    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is string colorStr && BrushMap.TryGetValue(colorStr, out var brush))
        {
            return brush;
        }
        return BrushMap["yellow"];
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
