export function streamChat(prompt, image, onToken, onDone, onError) {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const controller = new AbortController();

  fetch('/api/chat/completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ prompt, image }),
    signal: controller.signal,
  }).then(async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n').filter(l => l.startsWith('data:'));

      for (const line of lines) {
        const json = line.replace(/^data:\s*/, '');
        try {
          const data = JSON.parse(json);
          if (data.done) {
            onDone();
          } else if (data.token) {
            onToken(data.token);
          }
        } catch (e) {
          // parse error, skip
        }
      }
    }
  }).catch(err => {
    if (err.name !== 'AbortError') {
      onError?.(err);
    }
  });

  return () => controller.abort();
}
