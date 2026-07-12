# Sciwrix for Windows

Sciwrix for Windows is a portable C# desktop shell around the same self-contained editor used by the web and Android editions.

- One self-contained `Sciwrix.exe`; no installer or separate .NET installation
- Native Open, Save and Save As dialogs, with direct saving to an opened Markdown file
- Markdown, HTML and LaTeX export
- Windows printing and PDF printers
- Command-line and drag-and-drop opening of `.md`, `.markdown` and `.txt`
- Offline editor embedded into the executable

The Microsoft Edge WebView2 Runtime is the only system prerequisite. It is present on normal Windows 10 and Windows 11 installations. Sciwrix stores its extracted editor and browser profile beneath the current user's local application-data folder.

Build with the .NET 8 SDK:

```powershell
dotnet publish windows/Sciwrix.Windows/Sciwrix.Windows.csproj -c Release -r win-x64 --self-contained true
```
