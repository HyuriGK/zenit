'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Pause, Play, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  maxDuration?: number; // em segundos, padrão 45 minutos (2700s)
  disabled?: boolean;
}

export function AudioRecorder({
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  maxDuration = 2700, // 45 minutos padrão
  disabled = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Verificar se atingiu o limite máximo
  useEffect(() => {
    if (duration >= maxDuration && isRecording) {
      stopRecording();
    }
  }, [duration, maxDuration, isRecording]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setError(null);
    setPermissionDenied(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;

      // Usar WebM com Opus para melhor compressão
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128kbps para boa qualidade com tamanho razoável
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        // Criar URL para preview
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Parar o stream
        stream.getTracks().forEach(track => track.stop());

        onRecordingStop?.();
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Erro durante a gravação. Tente novamente.');
        stopRecording();
      };

      // Iniciar gravação com timeslice de 1 segundo para ter chunks menores
      mediaRecorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setAudioBlob(null);
      setAudioUrl(null);

      // Timer para atualizar duração
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      onRecordingStart?.();
    } catch (err: any) {
      console.error('Error starting recording:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Permissão de microfone negada. Por favor, permita o acesso ao microfone nas configurações do seu navegador.');
      } else if (err.name === 'NotFoundError') {
        setError('Nenhum microfone encontrado. Conecte um microfone e tente novamente.');
      } else {
        setError('Erro ao acessar o microfone. Verifique as permissões do navegador.');
      }
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const discardRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
  };

  const confirmRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
    }
  };

  // Calcular porcentagem do tempo usado
  const progressPercent = (duration / maxDuration) * 100;
  const isNearLimit = progressPercent >= 80;

  return (
    <div className="space-y-4">
      {/* Mensagem de erro */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Estado: Pronto para gravar */}
      {!isRecording && !audioBlob && (
        <div className="flex flex-col items-center gap-4 py-8">
          <button
            onClick={startRecording}
            disabled={disabled || permissionDenied}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <Mic className="w-8 h-8 text-white" />
          </button>
          <p className="text-sm text-zinc-400">
            Clique para iniciar a gravação
          </p>
          <p className="text-xs text-zinc-500">
            Tempo máximo: {formatTime(maxDuration)}
          </p>
        </div>
      )}

      {/* Estado: Gravando */}
      {isRecording && (
        <div className="flex flex-col items-center gap-4 py-6">
          {/* Indicador de gravação */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-sm text-zinc-400">
              {isPaused ? 'Pausado' : 'Gravando...'}
            </span>
          </div>

          {/* Timer */}
          <div className="text-4xl font-mono text-white">
            {formatTime(duration)}
          </div>

          {/* Barra de progresso */}
          <div className="w-full max-w-xs">
            <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${isNearLimit ? 'bg-yellow-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1 text-center">
              {formatTime(maxDuration - duration)} restantes
            </p>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-3">
            {isPaused ? (
              <Button
                onClick={resumeRecording}
                variant="default"
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-5 h-5 mr-2" />
                Continuar
              </Button>
            ) : (
              <Button
                onClick={pauseRecording}
                variant="default"
                size="lg"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pausar
              </Button>
            )}
            <Button
              onClick={stopRecording}
              variant="default"
              size="lg"
              className="bg-red-600 hover:bg-red-700"
            >
              <Square className="w-5 h-5 mr-2" />
              Parar
            </Button>
          </div>
        </div>
      )}

      {/* Estado: Gravação finalizada */}
      {!isRecording && audioBlob && audioUrl && (
        <div className="flex flex-col items-center gap-4 py-6">
          <p className="text-sm text-zinc-400">
            Gravação finalizada - {formatTime(duration)}
          </p>

          {/* Player de preview */}
          <audio
            src={audioUrl}
            controls
            className="w-full max-w-md"
          />

          {/* Tamanho do arquivo */}
          <p className="text-xs text-zinc-500">
            Tamanho: {(audioBlob.size / (1024 * 1024)).toFixed(2)} MB
          </p>

          {/* Botões de ação */}
          <div className="flex items-center gap-3">
            <Button
              onClick={discardRecording}
              variant="default"
              className="border-zinc-700 hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Descartar
            </Button>
            <Button
              onClick={confirmRecording}
              className="bg-green-600 hover:bg-green-700"
            >
              <Mic className="w-4 h-4 mr-2" />
              Usar gravação
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
