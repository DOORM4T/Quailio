import { base } from "grommet"
import { store } from "../../src/store/store"

const baseUrl = Cypress.config().baseUrl || ""

describe("Cypress", () => {
  it("Is working", () => {
    expect(true).to.equal(true)
  })

  it("Visits the app", () => {
    cy.visit("/")
  })
})

describe("Home page", () => {
  it('Navigates to Login page upon "Sign In" button click', () => {
    const loginUrl = `${baseUrl}/login`
    cy.visit("/").get("#sign-in-button").click().url().should("eq", loginUrl)
  })

  it('Navigates to Register page upon "Register" button click', () => {
    const registerUrl = `${baseUrl}/register`
    cy.visit("/")
      .get("#register-button")
      .click()
      .url()
      .should("eq", registerUrl)
  })
})

const TEST_EMAIL = "test@example.com"
const TEST_PASSWORD = "test123"
const CONFIRM_DELETE_ACCOUNT_MESSAGE =
  "Are you sure you want to delete your account? This action cannot be reversed."
describe("User authentication", () => {
  it("Registers a user", () => {
    cy.visit("/register")
      .get("#email-field")
      .type(TEST_EMAIL)
      .get("#password-field")
      .type(TEST_PASSWORD)
      .get("#confirm-password-field")
      .type(TEST_PASSWORD)
      .get("#register-button")
      .click()
      .url()
      /* Successful registration should send the user to the Dashboard route */
      .should("equal", `${baseUrl}/dashboard`)
  })

  it("Signs out a user", () => {
    cy.get("#navigation-menu")
      .click()
      .get("#logout-anchor")
      .click()
      .url()
      /* A successful sign-out should send the user to the Home route */
      .should("equal", `${baseUrl}/`)
  })

  it("Signs in a user", () => {
    cy.visit("/login")
      .get("#email-field")
      .type(TEST_EMAIL)
      .get("#password-field")
      .type(TEST_PASSWORD)
      .get("#login-button")
      .click()
      .url()
      /* A successful sign in should send the user to the Dashboard route */
      .should("equal", `${baseUrl}/dashboard`)
  })

  it("Deletes a user account", () => {
    cy.on("window:confirm", (str) => {
      expect(str).to.equal(CONFIRM_DELETE_ACCOUNT_MESSAGE)
    })

    cy.get("#navigation-menu")
      .click()
      .get("#settings-anchor")
      .click()
      .get("#manage-accordion")
      .click()
      .get("#delete-account-button")
      .click()
      .wait(1000)
      .should(() => {
        const userId = store.getState().auth.userId
        // tslint:disable-next-line:no-unused-expression
        expect(userId).to.not.be.ok
      })
      .url()
      .should("equal", `${baseUrl}/`)
  })
})

export {}
