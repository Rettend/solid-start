describe("per-route ssr:false", () => {
  it("does not render server markup but hydrates on client", () => {
    cy.request({ url: "/ssr-off", followRedirect: false }).then(res => {
      expect(res.body).not.to.contain("SSR-OFF");
      expect(res.body).to.contain("<div id=\"app\"></div>");
    });

    cy.visit("/ssr-off");
    cy.get("#ssr-flag").contains("SSR-OFF");
    cy.get("#ssr-off-count").contains("0");
    cy.get("#ssr-off-button").click();
    cy.get("#ssr-off-count").contains("1");
  });
});


