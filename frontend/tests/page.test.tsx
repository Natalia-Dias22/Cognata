import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Page from '@/app/page'
import { reconstructWord } from '@/lib/reconstruct'

jest.mock('@/lib/reconstruct', () => ({
  reconstructWord: jest.fn(),
}))

const mockedReconstructWord = jest.mocked(reconstructWord)

function answerCurrentLanguage(value: string) {
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

    answerCurrentLanguage('fogo')
    await waitFor(() => expect(screen.getByText('E em Italiano, como se diz?')).toBeInTheDocument())
    answerCurrentLanguage('fuoco')
    await waitFor(() => expect(screen.getByText('Agora a versão em Espanhol:')).toBeInTheDocument())
    answerCurrentLanguage('fuego')
    await waitFor(() => expect(screen.getByText('Em Francês, qual a forma?')).toBeInTheDocument())
    answerCurrentLanguage('feu')
    await waitFor(() => expect(screen.getByText('Por fim, como fica em Romeno?')).toBeInTheDocument())
    answerCurrentLanguage('foc')

    expect(mockedReconstructWord).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Modelo em execução')).toBeInTheDocument()
  })

  it('bloqueia o envio de respostas vazias ou compostas apenas por espaços', () => {
    render(<Page />)
    const submit = screen.getByRole('button', { name: 'Enviar resposta' })
    const input = screen.getByRole('textbox')

    expect(submit).toBeDisabled()
    fireEvent.change(input, { target: { value: '   ' } })
    expect(submit).toBeDisabled()
    expect(screen.getByText('Qual é a palavra em Português?')).toBeInTheDocument()
  })

  it('exibe a palavra retornada pela reconstrução', async () => {
    mockedReconstructWord.mockResolvedValue('AMICUS')
    render(<Page />)

    answerCurrentLanguage('fogo')
    answerCurrentLanguage('fuoco')
    answerCurrentLanguage('fuego')
    answerCurrentLanguage('feu')
    answerCurrentLanguage('foc')

    await waitFor(() => expect(screen.getByText('AMICUS')).toBeInTheDocument())
    expect(screen.getByText('Reconstrução concluída')).toBeInTheDocument()
  })

  it('exibe uma mensagem clara quando a reconstrução falha', async () => {
    mockedReconstructWord.mockRejectedValue(new Error('falha'))
    render(<Page />)

    answerCurrentLanguage('fogo')
    answerCurrentLanguage('fuoco')
    answerCurrentLanguage('fuego')
    answerCurrentLanguage('feu')
    answerCurrentLanguage('foc')

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir a reconstrução'))
    expect(screen.getByRole('textbox')).not.toBeDisabled()
  })
})
