import {
  IGrammar,
  IRawThemeSetting,
  Registry,
  StackElement,
} from 'vscode-textmate'
import TokenMetadata, { Style } from './core/TokenMetadata'
import * as languagePaths from './languages'

export interface LineToken {
  token: string
  style: Style
}

export default class Tokenizer {
  private grammar: IGrammar
  private colorMap: string[]
  private ruleStack: StackElement

  constructor(themeSettings: IRawThemeSetting[], language: string) {
    const registry = new Registry({
      theme: {
        settings: themeSettings,
      },
      getFilePath: scopeName => null,
      getInjections: scopeName => null,
    })

    const lanugagePath = (languagePaths as any)[language]
    if (!lanugagePath) {
      throw new Error(`Language file not found for ${language}`)
    }

    this.grammar = registry.loadGrammarFromPathSync(lanugagePath)
    this.colorMap = registry.getColorMap()
  }

  tokenizeText(text: string): LineToken[][] {
    this.ruleStack = null
    return text.split('\n').map(line => this.tokenizeLine(line))
  }

  tokenizeLine(line: string): LineToken[] {
    const r = this.grammar.tokenizeLine2(line, this.ruleStack)
    const tokensCount = r.tokens.length / 2
    const charCount = line.length
    let charIndex = 0

    const lineTokens: LineToken[] = []
    for (let tokenIndex = 0; tokenIndex < tokensCount; tokenIndex++) {
      let token = ''
      const tokenEndIndex =
        tokenIndex + 1 < tokensCount ? r.tokens[2 * tokenIndex + 2] : charCount

      for (; charIndex < tokenEndIndex && charIndex < charCount; charIndex++) {
        const char = line.charAt(charIndex)
        token += char
      }

      const metadata = r.tokens[2 * tokenIndex + 1]
      const style = TokenMetadata.getStyleObject(metadata, this.colorMap)
      lineTokens.push({ token, style })
    }

    this.ruleStack = r.ruleStack

    return lineTokens
  }
}
