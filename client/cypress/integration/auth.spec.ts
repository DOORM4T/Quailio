import { store } from "../../src/store/store"
import {
  BASE_URL,
  TEST_EMAIL,
  TEST_PASSWORD,
  CONFIRM_DELETE_ACCOUNT_MESSAGE,
} from "../fixtures/constants"

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
    const loginUrl = `${BASE_URL}/login`
    cy.visit("/").get("#sign-in-button").click().url().should("eq", loginUrl)
  })

  it('Navigates to Register page upon "Register" button click', () => {
    const registerUrl = `${BASE_URL}/register`
    cy.visit("/")
      .get("#register-button")
      .click()
      .url()
      .should("eq", registerUrl)
  })
})

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
      .should("equal", `${BASE_URL}/dashboard`)
      /* Wait for the user doc to be created */
      .wait(5000)
  })

  it("Signs out a user", () => {
    cy.get("#navigation-menu")
      .click()
      .get("#logout-anchor")
      .click()
      .url()
      /* A successful sign-out should send the user to the Home route */
      .should("equal", `${BASE_URL}/`)
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
      .should("equal", `${BASE_URL}/dashboard`)
  })

  it("Deletes a user account", () => {
    cy.on("window:confirm", (str) => {
      expect(str).to.equal(CONFIRM_DELETE_ACCOUNT_MESSAGE)
      return true
    })

    cy.get("#navigation-menu")
      .click()
      .get("#settings-anchor")
      .click()
      .get("#manage-accordion")
      .click()
      .get("#delete-account-button")
      .click()
      .url()
      .should("equal", `${BASE_URL}/`)
  })
})

export {}
