const supported = () => typeof window !== 'undefined' && 'Notification' in window

export function notifyPermission(): NotificationPermission | 'unsupported' {
  return supported() ? Notification.permission : 'unsupported'
}

export async function requestNotifyPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!supported()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/** Shows a system notification only when the page isn't in front of the user. */
export function notify(title: string, body: string) {
  if (!supported() || Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible' && document.hasFocus()) return
  try {
    const n = new Notification(title, { body, icon: '/favicon.svg', tag: 'focus-pet' })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    // Some browsers (e.g. Android Chrome) only allow notifications via a service worker.
  }
}
