import { LinkObject, NodeObject } from "force-graph"
import { IPerson } from "../../../store/networks/networkTypes"

export interface IForceGraphData {
  nodes: (IPersonNode & NodeObject)[]
  links: LinkObject[]
}

export interface IPersonNode extends IPerson {
  thumbnail: HTMLImageElement | null
  neighbors: IPersonNode[]
  links: LinkObject[]
  isGroupNode: boolean // A group can be represented by a PersonNode
}
export type XYVals = { x: number; y: number }
export type NodeToConnect = {
  node: IPersonNode | null
}

// TODO: Article Node Types
// type ArticleType = "image" | "externallink"
