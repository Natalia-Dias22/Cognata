import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Page from '@/app/page'
import { reconstructWord } from '@/lib/reconstruct'

jest.mock('@/lib/reconstruct', () => ({
  reconstructWord: jest.fn(),
}))

const mockedReconstructWord = jest.mocked(reconstructWord)

async function answerCurrentLanguage(value: string) {
  await waitFor(() => expect(screen.getByRole('textbox')).not.toBeDisabled())
  fireEvent.change(screen.getByRole('textbox'), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar resposta' }))
}

describe('Fluxo do Reconstrutor Latino', () => {
  beforeEach(() => {
    mockedReconstructWord.mockResolvedValue('FOCUS')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('inicia em Português e percorre as cinco línguas na ordem correta', async () => {
    mockedReconstructWord.mockImplementation(() => new Promise(() => undefined))
    render(<Page />)
    expect(screen.getByText('Qual é a palavra em Português?')).toBeInTheDocument()

    await answerCurrentLanguage('fogo')
    await waitFor(() => expect(screen.getByText('E em Italiano, como se diz?')).toBeInTheDocument())
    await answerCurrentLanguage('fuoco')
    await waitFor(() => expect(screen.getByText('Agora a versão em Espanhol:')).toBeInTheDocument())
    await answerCurrentLanguage('fuego')
    await waitFor(() => expect(screen.getByText('Em Francês, qual a forma?')).toBeInTheDocument())
    await answerCurrentLanguage('feu')
    await waitFor(() => expect(screen.getByText('Por fim, como fica em Romeno?')).toBeInTheDocument())
    await answerCurrentLanguage('foc')

    expect(mockedReconstructWord).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Modelo em execução')).toBeInTheDocument()
  })

  it('bloqueia o envio de respostas vazias ou compostas apenas por espaços', () => {
    render(<Page />)
    const submit = screen.getByRole('button', { name: 'Enviar resposta' })
    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: '   ' } })
    expect(submit).not.toBeDisabled()
    fireEvent.click(submit)
    expect(screen.getByRole('alert')).toHaveTextContent('Digite a palavra')
    expect(screen.getByText('Qual é a palavra em Português?')).toBeInTheDocument()
  })

  it('filtra caracteres inválidos e preserva caracteres dos idiomas', () => {
    render(<Page />)
    const input = screen.getByRole('textbox')

    fireEvent.input(input, { target: { value: 'ação déjà-vu șț 123@!' } })

    expect(input).toHaveValue('ação déjà-vu șț ')
  })

  it('limita a entrada a 100 caracteres e remove o alerta ao digitar', () => {
    render(<Page />)
    const input = screen.getByRole('textbox')
    const submit = screen.getByRole('button', { name: 'Enviar resposta' })

    fireEvent.click(submit)
    expect(screen.getByRole('alert')).toHaveTextContent('Digite a palavra')

    fireEvent.input(input, { target: { value: 'palavra' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    fireEvent.input(input, { target: { value: 'a'.repeat(101) } })
    expect(input).toHaveValue('a'.repeat(100))
    expect(input).toHaveAttribute('maxLength', '100')
  })

  it('exibe a palavra retornada pela reconstrução', async () => {
    mockedReconstructWord.mockResolvedValue('AMICUS')
    render(<Page />)

    await answerCurrentLanguage('fogo')
    await waitFor(() => expect(screen.getByText('E em Italiano, como se diz?')).toBeInTheDocument())
    await answerCurrentLanguage('fuoco')
    await waitFor(() => expect(screen.getByText('Agora a versão em Espanhol:')).toBeInTheDocument())
    await answerCurrentLanguage('fuego')
    await waitFor(() => expect(screen.getByText('Em Francês, qual a forma?')).toBeInTheDocument())
    await answerCurrentLanguage('feu')
    await waitFor(() => expect(screen.getByText('Por fim, como fica em Romeno?')).toBeInTheDocument())
    await answerCurrentLanguage('foc')

    await waitFor(() => expect(screen.getByText('AMICUS')).toBeInTheDocument())
    expect(screen.getByText('Reconstrução concluída')).toBeInTheDocument()
  })

  it('exibe uma mensagem clara quando a reconstrução falha', async () => {
    mockedReconstructWord.mockRejectedValue(new Error('falha'))
    render(<Page />)

    await answerCurrentLanguage('fogo')
    await waitFor(() => expect(screen.getByText('E em Italiano, como se diz?')).toBeInTheDocument())
    await answerCurrentLanguage('fuoco')
    await waitFor(() => expect(screen.getByText('Agora a versão em Espanhol:')).toBeInTheDocument())
    await answerCurrentLanguage('fuego')
    await waitFor(() => expect(screen.getByText('Em Francês, qual a forma?')).toBeInTheDocument())
    await answerCurrentLanguage('feu')
    await waitFor(() => expect(screen.getByText('Por fim, como fica em Romeno?')).toBeInTheDocument())
    await answerCurrentLanguage('foc')

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir a reconstrução'))
    expect(screen.getByRole('textbox')).not.toBeDisabled()
  })
})
