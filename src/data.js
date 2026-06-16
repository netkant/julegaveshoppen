import { artifact } from "./hooks/artifact";

const API_BASE = "https://julegaveshop6itd.barani.micusto.cloud/wp-json/nkt-dev/v1";

/**
 * Static step configuration (not state, just the wizard layout).
 */
export const steps = [
    {
        id: 1,
        name: "Vælg shops",
    },
    {
        id: 2,
        name: "Vælg gavekort leveringsmetode",
    },
    {
        id: 3,
        name: "Vælg pakkeleveringstidspunkt",
    },
    {
        id: 4,
        name: "Angiv din e-mail og firmanavn",
    },
    {
        id: 5,
        name: "Oversigt og bestilling",
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
    fetch(`${API_BASE}/price-groups`)
        .then((response) => response.json())
        .then((data) => data.items),
);
export const selectedPriceGroupsArtifact = artifact([]);

/**
 * Delivery Methods.
 */
export const deliveryMethodsArtifact = artifact(() =>
    fetch(`${API_BASE}/delivery-methods`)
        .then((response) => response.json())
        .then((data) => data.items),
);
export const selectedDeliveryMethodArtifact = artifact(null);

/**
 * Delivery Dates.
 */
export const deliveryDatesArtifact = artifact(() =>
    fetch(`${API_BASE}/delivery-dates`)
        .then((response) => response.json())
        .then((data) => data.items),
);
export const selectedDeliveryDateArtifact = artifact(null);

/**
 * Derived order payload -- recomputes whenever any selection changes.
 */
export const orderObjectArtifact = artifact(({ get }) => ({
    price_groups: get(selectedPriceGroupsArtifact).map((pg) => ({ id: pg.id, quantity: pg.quantity })),
    delivery_method: get(selectedDeliveryMethodArtifact)?.id,
    delivery_date: get(selectedDeliveryDateArtifact)?.id,
    info: get(infoArtifact),
}));
