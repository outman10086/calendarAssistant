import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  supported: boolean;
}

export function useSpeech(): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setSupported(isSupported);
  }, []);

  const startListening = useCallback(() => {
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    if (!isSupported) {
      setError('浏览器不支持语音识别');
      return;
    }

    // 重置状态
    setTranscript('');
    setError(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      const result = event.results?.[0]?.[0]?.transcript || '';
      console.log('[Speech] onresult:', result);
      setTranscript(result);
    };

    recognition.onerror = (event: any) => {
      console.error('[Speech] onerror:', event.error);
      let msg = '语音识别出错';
      switch (event.error) {
        case 'not-allowed':
          msg = '请允许麦克风权限（点击地址栏的🔒图标开启）';
          break;
        case 'no-speech':
          msg = '没有检测到语音，请靠近麦克风说话';
          break;
        case 'network':
          msg = '网络错误，语音识别需要联网';
          break;
        case 'aborted':
          msg = '识别已取消';
          break;
        case 'audio-capture':
          msg = '无法访问麦克风，请检查设备';
          break;
      }
      setError(msg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err: any) {
      console.error('[Speech] start error:', err);
      setError('启动语音识别失败: ' + (err.message || '未知错误'));
    }
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  return { isListening, transcript, startListening, stopListening, error, supported };
}
