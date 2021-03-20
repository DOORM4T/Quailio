import { auth } from "../firebase/services"

export const handlePasswordReset = () => {
  if (auth.currentUser && auth.currentUser.email) {
    // User is logged in? Send the reset request immediately
    auth.sendPasswordResetEmail(auth.currentUser.email)
    window.alert(`Sent a password reset request to ${auth.currentUser.email}`)
  } else {
    // User isn't logged in, prompt for their email
    const email = window.prompt("Enter your email address:")
    if (!email) return

    auth.sendPasswordResetEmail(email)
    window.alert(
      `Sent a password reset request to ${email}, if it is registered with Quailio.`,
    )
  }
}
