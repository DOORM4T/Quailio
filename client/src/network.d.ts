export interface INetworkSketchState {
  people: IPerson[]
}

export interface IPerson {
  name: string
  thumbnail_url?: string
  relationships: { [name: string]: Relationship }
}

export type Relationship = [you: string, them: string]
