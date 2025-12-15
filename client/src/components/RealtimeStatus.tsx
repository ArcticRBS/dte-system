/**
 * Componente de indicador de status de conexão Realtime
 * Mostra visualmente se a conexão com o Supabase Realtime está ativa
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface RealtimeStatusProps {
  showLabel?: boolean;
  className?: string;
}

export default function RealtimeStatus({ showLabel = false, className = '' }: RealtimeStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [lastPing, setLastPing] = useState<Date | null>(null);

  useEffect(() => {
    // Criar canal de teste para verificar conexão
    const channel = supabase.channel('connection-test', {
      config: {
        presence: {
          key: 'status',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        setStatus('connected');
        setLastPing(new Date());
      })
      .on('presence', { event: 'join' }, () => {
        setStatus('connected');
        setLastPing(new Date());
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
          setLastPing(new Date());
          // Enviar presença para confirmar conexão
          channel.track({ online: true });
        } else if (status === 'CLOSED') {
          setStatus('disconnected');
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('error');
        } else if (status === 'TIMED_OUT') {
          setStatus('disconnected');
        }
      });

    // Verificar conexão periodicamente
    const interval = setInterval(() => {
      if (channel.state === 'joined') {
        setStatus('connected');
        setLastPing(new Date());
      } else if (channel.state === 'closed' || channel.state === 'errored') {
        setStatus('disconnected');
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="w-4 h-4" />,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          pulseColor: 'bg-emerald-500',
          label: 'Conectado',
          description: 'Conexão em tempo real ativa',
        };
      case 'connecting':
        return {
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          pulseColor: 'bg-amber-500',
          label: 'Conectando',
          description: 'Estabelecendo conexão...',
        };
      case 'disconnected':
      case 'error':
        return {
          icon: <WifiOff className="w-4 h-4" />,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          pulseColor: 'bg-red-500',
          label: 'Desconectado',
          description: 'Conexão em tempo real inativa',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex items-center gap-2 px-2 py-1 rounded-full border ${config.bgColor} ${config.borderColor} ${className}`}
        >
          {/* Indicador de pulso */}
          <div className="relative">
            <span className={`absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75 ${status === 'connected' ? 'animate-ping' : ''}`} style={{ animationDuration: '2s' }}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${config.pulseColor}`}></span>
          </div>
          
          {/* Ícone */}
          <span className={config.color}>{config.icon}</span>
          
          {/* Label opcional */}
          {showLabel && (
            <span className={`text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-slate-800 border-slate-700">
        <div className="text-sm">
          <p className="font-medium">{config.label}</p>
          <p className="text-slate-400 text-xs">{config.description}</p>
          {lastPing && status === 'connected' && (
            <p className="text-slate-500 text-xs mt-1">
              Último ping: {lastPing.toLocaleTimeString()}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
