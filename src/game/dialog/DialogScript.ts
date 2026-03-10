export interface DialogLine {
  speaker: string
  text: string
  speakerColor?: string // hex, e.g. '#f0a030'
}

export interface DialogScript {
  lines: DialogLine[]
}
