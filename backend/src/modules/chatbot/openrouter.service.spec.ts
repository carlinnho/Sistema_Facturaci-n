import { ConfigService } from '@nestjs/config';
import { OpenRouterService } from './openrouter.service';

describe('OpenRouterService', () => {
  let fetchMock: jest.SpyInstance;
  const create = (values: Record<string, string>) =>
    new OpenRouterService(new ConfigService(values));
  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => jest.restoreAllMocks());

  it('funciona sin clave y no hace una llamada externa', async () => {
    expect((await create({}).resumir({})).aviso).toContain(
      'no esta configurado',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('impide activar un modelo de pago accidentalmente', async () => {
    await create({
      OPENROUTER_API_KEY: 'test-key',
      OPENROUTER_MODEL: 'openrouter/auto',
    }).resumir({});
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('usa la API de chat con openrouter/free y contexto acotado', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: 'Hay stock.' }, finish_reason: 'stop' },
          ],
        }),
      ),
    );
    const result = await create({ OPENROUTER_API_KEY: 'test-key' }).resumir({
      Stock: 5,
    });
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    const body = JSON.parse(request.body);
    expect(body.model).toBe('openrouter/free');
    expect(body.messages[1].content).toBe('{"Stock":5}');
    expect(body.tools).toBeUndefined();
    expect(result.texto).toBe('Hay stock.');
  });
  it.each([401, 403, 429, 500])(
    'maneja HTTP %s sin exponer el cuerpo del proveedor',
    async (status) => {
      fetchMock.mockResolvedValue(new Response('secreto-privado', { status }));
      const result = await create({ OPENROUTER_API_KEY: 'test-key' }).resumir(
        {},
      );
      expect(result.aviso).toBeDefined();
      expect(JSON.stringify(result)).not.toContain('secreto-privado');
      expect(result.texto).toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );
  it.each([
    {},
    { error: { message: 'privado' } },
    { choices: [{ message: { content: '' } }] },
    {
      choices: [
        { message: { content: 'Texto parcial' }, finish_reason: 'length' },
      ],
    },
  ])('maneja respuestas vacias o incompletas', async (response) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(response)));
    expect(
      (await create({ OPENROUTER_API_KEY: 'test-key' }).resumir({})).aviso,
    ).toBeDefined();
  });
  it('maneja timeout o falta de red', async () => {
    fetchMock.mockRejectedValue(new Error('Timeout'));
    expect(
      (await create({ OPENROUTER_API_KEY: 'test-key' }).resumir({})).aviso,
    ).toContain('a tiempo');
  });
});
