export interface INetwork {
  id: string
  name: string
  personIds: string[]
  sharedProperties?: ISharedNetworkProperties
}

interface ISharedNetworkProperties {
  sharedId: string | null
  allowList: IAllowListUser[]
}

interface IAllowListUser {
  email: string
  canEdit: boolean
}
