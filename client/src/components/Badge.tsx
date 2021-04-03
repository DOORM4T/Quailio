import React, { CSSProperties } from "react"

interface IProps {
  name: string
  backgroundColor: string
  textColor: string
  render?: (badgeName: string) => React.ReactNode
  [key: string]: any
}

const Badge: React.FC<IProps> = ({
  backgroundColor,
  name,
  textColor,
  render,
}) => {
  return (
    <div
      style={{
        ...groupBadgeStyles,
        backgroundColor,
        color: textColor,
      }}
    >
      {/* Using render props. If no render props specified, display just the badge name  */}
      {render ? render(name) : <span>{name}</span>}
    </div>
  )
}

const groupBadgeStyles: CSSProperties = {
  textAlign: "center",
  fontSize: 12,
  borderRadius: 4,
  padding: "0 4px",
  margin: "0 2px",
  whiteSpace: "nowrap",
  display: "flex",
  flexFlow: "row nowrap",
  alignItems: "center",
  justifyItems: "center",
}

export default Badge
