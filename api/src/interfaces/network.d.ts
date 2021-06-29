export interface INetwork {
  id: string
  name: string
  personIds: string[]
  sharedProperties?: ISharedNetworkProperties
}

export interface INetworkExport {
  name: string
  people: IPerson[]
}

interface ISharedNetworkProperties {
  sharedId: string | null
  allowList: IAllowListUser[]
}

interface IAllowListUser {
  email: string
  canEdit: boolean
}

export interface IPerson {
  id: string
  name: string
  relationships: IRelationships
  thumbnailUrl?: string
  content?: string
  pinXY?: XYVals
  scaleXY?: XYVals
  isBackground?: boolean
  isGroup?: boolean
  backgroundColor?: string
  textColor?: string
  doHideNameTag?: boolean
}

type IRelationships = { [otherPersonId: string]: IRelationship }

interface IRelationship {
  reason: string
  shape?: ConnectionShape
}

type ConnectionShape = "arrow" | "none"

type XYVals = { x: number; y: number }
