import { artifact } from "./hooks/artifact";

export const jgVars = JSON.parse(document.getElementById("form-root").dataset.params || "{}");
/**
 * Static step configuration (not state, just the wizard layout).
 */
export const steps = [
    {
        id: 1,
        name: jgVars.steps && jgVars.steps[0].name ? jgVars.steps[0].name : "Vælg shops",
        description: jgVars.steps && jgVars.steps[0].description ? jgVars.steps[0].description : "Vælg de shops du ønsker at bestille og hvor mange gaver der skal kunne bestilles.",
    },
    {
        id: 2,
        name: jgVars.steps && jgVars.steps[1].name ? jgVars.steps[1].name : "Vælg gavekort-leveringsmetode",
        description: jgVars.steps && jgVars.steps[1].description ? jgVars.steps[1].description : "Vælg den leveringsmetode, du ønsker at bruge til at levere gavekortene.",
    },
    {
        id: 3,
        name: jgVars.steps && jgVars.steps[2].name ? jgVars.steps[2].name : "Vælg gave-leveringstidspunkt",
        description: jgVars.steps && jgVars.steps[2].description ? jgVars.steps[2].description : "Vælg det tidspunkt, du ønsker at gaverne leveres.",
    },
    {
        id: 4,
        name: jgVars.steps && jgVars.steps[3].name ? jgVars.steps[3].name : "Angiv dine kontaktoplysninger",
        description: jgVars.steps && jgVars.steps[3].description ? jgVars.steps[3].description : "Angiv dine kontaktoplysninger for at kunne bestille gaverne.",
    },
    {
        id: 5,
        name: jgVars.steps && jgVars.steps[4].name ? jgVars.steps[4].name : "Oversigt og bestilling",
        description: jgVars.steps && jgVars.steps[4].description ? jgVars.steps[4].description : "Oversigt og bestilling af gaverne.",
    },
];

/**
 * Wizard navigation + contact details.
 */
export const currentStepArtifact = artifact(1);

export const infoArtifact = artifact({
    email: "",
    companyName: "",
    cvr: "",
    phoneNumber: "",
    address: "",
    postalCode: "",
    city: "",
    contactPerson: "",
});

/**
 * Price Groups -- fetched lazily on first read (component suspends until ready).
 */
export const priceGroupsArtifact = artifact(() =>
    fetch(`${jgVars.apiBase}/price-groups`)
        .then((response) => response.json())
        .then((data) => data.items),
);
export const selectedPriceGroupsArtifact = artifact([]);

/**
 * Delivery Methods.
 */
export const deliveryMethodsArtifact = artifact(() =>
    fetch(`${jgVars.apiBase}/delivery-methods`)
        .then((response) => response.json())
        .then((data) => data.items),
);
export const selectedDeliveryMethodArtifact = artifact(null);

/**
 * Delivery Dates.
 */
export const deliveryDatesArtifact = artifact(() =>
    fetch(`${jgVars.apiBase}/delivery-dates`)
        .then((response) => response.json())
        .then((data) => data.items),
);
export const selectedDeliveryDateArtifact = artifact(null);

/**
 * Derived order payload -- recomputes whenever any selection changes.
 */
export const orderObjectArtifact = artifact(({ get }) => ({
    price_groups: get(selectedPriceGroupsArtifact).map((pg) => ({ id: pg.id, quantity: pg.quantity })),
    delivery_method: get(selectedDeliveryMethodArtifact),
    delivery_date: get(selectedDeliveryDateArtifact),
    info: get(infoArtifact),
}));
