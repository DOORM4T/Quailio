import { Heading, Image } from "grommet"
import React, { Dispatch } from "react"
import { useDispatch } from "react-redux"
import { Link, useHistory } from "react-router-dom"
import Logo from "../../assets/logo.png"
import useAuth from "../../hooks/auth/useAuth"
import { routeNames } from "../../Routes"
import { logout } from "../../store/auth/authActions"
import Header from "../Header"
import { MenuItems } from "./AppBurgerMenu"

export const HEADER_HEIGHT = 60

interface IProps {
  title: string
  showLogo?: boolean
  children?: React.ReactNode
}

const AppHeader: React.FC<IProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch()
  const history = useHistory()
  const { isAuthenticated } = useAuth()

  const logoutFunction = async () => {
    try {
      await dispatch(logout())
      history.push("/")
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Header
      title={props.title}
      height={HEADER_HEIGHT}
      menuItems={MenuItems({ isLoggedIn: isAuthenticated, logoutFunction })}
      children={
        <React.Fragment>
          {props.showLogo && (
            <React.Fragment>
              <Link to={routeNames.HOME}>
                <Image
                  src={Logo}
                  style={{ width: "50px" }}
                  margin={{ top: "xsmall" }}
                />
              </Link>
              <Heading level={2} margin={{ left: "xsmall" }}>
                {props.title}
              </Heading>
            </React.Fragment>
          )}
          {props.children}
        </React.Fragment>
      }
    />
  )
}

AppHeader.defaultProps = {
  showLogo: true,
}

export default AppHeader
