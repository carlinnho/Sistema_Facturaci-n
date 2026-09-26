import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CHATBOT_SYSTEM_PROMPT } from './chatbot.prompts';

export interface RedaccionChatbot {
  texto?: string;
  aviso?: string;
}

@Injectable()
export class OpenRouterService {
  constructor(private readonly config: ConfigService) {}

  async resumir(contexto: object): Promise<RedaccionChatbot> {
    const key = this.config.get<string>('OPENROUTER_API_KEY')?.trim();
    if (!key) {
      return {
        aviso:
          'El resumen IA aun no esta configurado. Estos son los datos del sistema.',
      };
    }
    const model =
      this.config.get<string>('OPENROUTER_MODEL')?.trim() || 'openrouter/free';
    if (model !== 'openrouter/free') {
      return {
        aviso:
          'Esta fase utiliza exclusivamente openrouter/free. Revisa la configuracion del backend.',
      };
    }
    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            stream: false,
            max_tokens: 600,
            messages: [
              { role: 'system', content: CHATBOT_SYSTEM_PROMPT },
              { role: 'user', content: JSON.stringify(contexto) },
            ],
          }),
          signal: AbortSignal.timeout(20000),
        },
      );
      if (response.status === 429) {
        return {
          aviso:
            'OpenRouter alcanzo su limite temporal de uso. Puedes consultar los datos debajo.',
        };
      }
      if (response.status === 401 || response.status === 403) {
        return {
          aviso:
            'OpenRouter no autorizo la conexion. El administrador debe revisar la clave del backend.',
        };
      }
      if (!response.ok) {
        return {
          aviso:
            'El resumen IA no esta disponible ahora. Se muestran los datos del sistema.',
        };
      }
      const result = (await response.json()) as {
        error?: unknown;
        choices?: { message?: { content?: unknown }; finish_reason?: string }[];
      };
      const choice = result.choices?.[0];
      const content = choice?.message?.content;
      if (
        result.error ||
        typeof content !== 'string' ||
        !content.trim() ||
        choice?.finish_reason === 'length'
      ) {
        return {
          aviso:
            'La IA no devolvio un resumen completo. Se muestran los datos del sistema.',
        };
      }
      return { texto: content.trim().slice(0, 3000) };
    } catch {
      // No propagar respuestas del proveedor: pueden incluir datos o credenciales.
      return {
        aviso:
          'No se pudo obtener el resumen IA a tiempo. Se muestran los datos del sistema.',
      };
    }
  }
}
