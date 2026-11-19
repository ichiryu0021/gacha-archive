Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class MiYouKeepAwake {
  [DllImport("kernel32.dll", SetLastError = true)]
  public static extern uint SetThreadExecutionState(uint esFlags);
}
"@

$flags = [uint32]2147483651
try {
  while ($true) {
    [MiYouKeepAwake]::SetThreadExecutionState($flags) | Out-Null
    Start-Sleep -Seconds 30
  }
} finally {
  [MiYouKeepAwake]::SetThreadExecutionState([uint32]2147483648) | Out-Null
}
