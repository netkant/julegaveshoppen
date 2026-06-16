import { Suspense, useState } from "react";
import "./assets/styles/fonts.css";
import "./assets/styles/options.css";
import "./assets/styles/steps.css";
import "./assets/styles/delivery-methods.css";
import "./assets/styles/order-summary.css";
import { readArtifact, resetArtifact, useArtifact, useArtifactValue } from "./hooks/artifact";
import { currentStepArtifact, infoArtifact, deliveryDatesArtifact, deliveryMethodsArtifact, orderObjectArtifact, priceGroupsArtifact, selectedDeliveryDateArtifact, selectedDeliveryMethodArtifact, selectedPriceGroupsArtifact, steps } from "./data";

function App() {
    const [currentStep, setCurrentStep] = useArtifact(currentStepArtifact);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const selectedPriceGroups = useArtifactValue(selectedPriceGroupsArtifact);
    const selectedDeliveryMethod = useArtifactValue(selectedDeliveryMethodArtifact);
    const selectedDeliveryDate = useArtifactValue(selectedDeliveryDateArtifact);
    const info = useArtifactValue(infoArtifact);

    const handleOrderClick = () => {
        const orderObject = readArtifact(orderObjectArtifact);
        setError(null);

        fetch("https://julegaveshop6itd.barani.micusto.cloud/wp-json/nkt-dev/v1/create-stores", {
            method: "POST",
            body: JSON.stringify(orderObject),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Bestilling fejlede med status ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log("data", data);
                setSubmitted(true);
            })
            .catch((error) => setError(error));
    };

    const handleOrderMoreClick = () => {
        resetArtifact(selectedPriceGroupsArtifact);
        resetArtifact(selectedDeliveryMethodArtifact);
        resetArtifact(selectedDeliveryDateArtifact);
        resetArtifact(currentStepArtifact);
        resetArtifact(infoArtifact);
        setSubmitted(false);
    };

    const canOrder = selectedPriceGroups.length && selectedDeliveryMethod && selectedDeliveryDate && info.email;

    const canAdvanceFromStep = {
        1: Boolean(selectedPriceGroups.length),
        2: Boolean(selectedDeliveryMethod),
        3: Boolean(selectedDeliveryDate),
        4: Boolean(info.email && info.companyName && info.cvr && info.contactPerson && info.phoneNumber && info.address && info.postalCode && info.city),
    };

    const canAdvance = Boolean(canAdvanceFromStep[currentStep]);

    if (submitted) {
        return (
            <div className="wizard-page">
                <div className="confirmation">
                    <h1>Tak for at bestille en butik</h1>
                    <button onClick={handleOrderMoreClick}>Bestil mere</button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="wizard-page">
                <div className="confirmation">
                    <h1>Fejl ved bestilling</h1>
                    <p>Der opstod en fejl ved bestillingen. Prøv igen senere. Kontakt support hvis fejlen fortsætter.</p>
                    <button onClick={() => setError(null)}>Prøv igen</button>
                </div>
            </div>
        );
    }

    return (
        <div className="wizard-page">
            <h1>Bestil en julegaveshop</h1>

            <div className="wizard">
                <aside className="step-list">
                    <ol>
                        {steps.map((step) => {
                            const status = currentStep === step.id ? "active" : currentStep > step.id ? "completed" : "upcoming";
                            return (
                                <li
                                    key={step.id}
                                    className={`step-item ${status}`}
                                >
                                    <span className="step-marker">{status === "completed" ? "✓" : step.id}</span>
                                    <span className="step-label">
                                        <span className="step-kicker">Trin {step.id}</span>
                                        <span className="step-name">{step.name}</span>
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                </aside>

                <section className="step-content">
                    <Suspense fallback={<p>Indlæser...</p>}>
                        <Step id={currentStep} />
                    </Suspense>

                    <div className="wizard-nav">
                        <button
                            disabled={currentStep === 1}
                            onClick={() => setCurrentStep(currentStep - 1)}
                        >
                            Forrige
                        </button>

                        {currentStep < steps.length ? (
                            <button
                                disabled={!canAdvance}
                                onClick={() => setCurrentStep(Math.min(currentStep + 1, steps.length))}
                            >
                                Næste
                            </button>
                        ) : (
                            <button
                                className="order-button"
                                disabled={!canOrder}
                                onClick={() => handleOrderClick()}
                            >
                                Bestil
                            </button>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default App;

function Step({ id }) {
    switch (id) {
        case 1:
            return <Step1 />;
        case 2:
            return <Step2 />;
        case 3:
            return <Step3 />;
        case 4:
            return <Step4 />;
        case 5:
            return <Step5 />;
        default:
            return null;
    }
}

function Step1() {
    const priceGroups = useArtifactValue(priceGroupsArtifact);
    const [selectedPriceGroups, setSelectedPriceGroups] = useArtifact(selectedPriceGroupsArtifact);

    const handlePriceGroupClick = (priceGroup) => {
        setSelectedPriceGroups((prev) => {
            if (prev.some((pg) => pg.id === priceGroup.id)) {
                return prev.filter((pg) => pg.id !== priceGroup.id);
            }
            return [...prev, { ...priceGroup, quantity: 5 }];
        });
    };

    const handlePriceGroupQuantityChange = (priceGroup, delta) => {
        setSelectedPriceGroups((prev) => prev.map((pg) => (pg.id === priceGroup.id ? { ...pg, quantity: Math.max(5, pg.quantity + delta) } : pg)));
    };

    return (
        <div>
            <h2>Vælg shops</h2>
            <div className="options">
                {priceGroups.map((priceGroup) => {
                    const selected = selectedPriceGroups.find((pg) => pg.id === priceGroup.id);
                    return (
                        <div
                            className={`price-group-option ${selected ? "selected" : ""}`}
                            key={priceGroup.id}
                            onClick={() => handlePriceGroupClick(priceGroup)}
                        >
                            {priceGroup.image && (
                                <div className="option-image-container">
                                    <img
                                        className="option-image"
                                        src={priceGroup.image}
                                        alt={`${priceGroup.name} image`}
                                    />
                                </div>
                            )}
                            {selected && <div className="check-mark">✓</div>}
                            <p className="price-group-option-name">{priceGroup.name}</p>
                            <div
                                className="quantity-stepper"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={() => handlePriceGroupQuantityChange(priceGroup, -1)}
                                >
                                    -
                                </button>
                                <span>{selected ? selected.quantity : 5}</span>
                                <button
                                    type="button"
                                    onClick={() => handlePriceGroupQuantityChange(priceGroup, 1)}
                                >
                                    +
                                </button>
                            </div>
                            <a
                                className="view-selection-button"
                                href={priceGroup.url}
                                target="_blank"
                            >
                                Se udvalg
                            </a>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Step2() {
    const deliveryMethods = useArtifactValue(deliveryMethodsArtifact);
    const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useArtifact(selectedDeliveryMethodArtifact);

    return (
        <div>
            <h2>Vælg gavekort levering</h2>
            <div className="options">
                {deliveryMethods.map((deliveryMethod) => (
                    <div
                        className={`option ${selectedDeliveryMethod?.id === deliveryMethod.id ? "selected" : ""}`}
                        key={deliveryMethod.id}
                        onClick={() => setSelectedDeliveryMethod(deliveryMethod)}
                    >
                        <p className="delivery-method-name">{deliveryMethod.name}</p>
                        {deliveryMethod.description && <p className="delivery-method-description">{deliveryMethod.description}</p>}
                        {deliveryMethod.price_text && <p className="delivery-method-price">{deliveryMethod.price_text}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function Step3() {
    const deliverydates = useArtifactValue(deliveryDatesArtifact);
    const [selectedDeliveryDate, setSelectedDeliveryDate] = useArtifact(selectedDeliveryDateArtifact);

    return (
        <div>
            <h2>Vælg pakkeleveringstidspunkt</h2>
            <div className="options">
                {deliverydates.map((deliverydate) => (
                    <div
                        className={`option ${selectedDeliveryDate?.id === deliverydate.id ? "selected" : ""}`}
                        key={deliverydate.id}
                        onClick={() => setSelectedDeliveryDate(deliverydate)}
                    >
                        <p>Uge {deliverydate.week_number}:</p>
                        <p>Seneste bestilling: {deliverydate.order_date}</p>
                        <p>Leveringsdato: {deliverydate.delivery_date}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Step4() {
    const [info, setInfo] = useArtifact(infoArtifact);

    const handleInfoChange = (key, value) => {
        setInfo((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div>
            <h2>Angiv din e-mail og firmanavn</h2>
            <div className="input-container">
                <label htmlFor="email">E-mail</label>
                <input
                    id="email"
                    value={info.email}
                    onChange={(e) => handleInfoChange("email", e.target.value)}
                    className="email-input input-field"
                    type="email"
                    placeholder="E-mail"
                    data-1p-ignore="true"
                />
            </div>
            <div className="input-container">
                <label htmlFor="company-name">Firmanavn</label>
                <input
                    id="company-name"
                    value={info.companyName}
                    onChange={(e) => handleInfoChange("companyName", e.target.value)}
                    className="company-name-input input-field"
                    type="text"
                    placeholder="Firmanavn"
                    data-1p-ignore="true"
                />
            </div>

            <div className="input-container">
                <label htmlFor="cvr">CVR</label>
                <input
                    id="cvr"
                    value={info.cvr}
                    onChange={(e) => handleInfoChange("cvr", e.target.value)}
                    className="cvr-input input-field"
                    type="text"
                    placeholder="CVR"
                    data-1p-ignore="true"
                />
            </div>

            <div className="input-container">
                <label htmlFor="contact-person">Kontaktperson</label>
                <input
                    id="contact-person"
                    value={info.contactPerson}
                    onChange={(e) => handleInfoChange("contactPerson", e.target.value)}
                    className="contact-person-input input-field"
                    type="text"
                    placeholder="Kontaktperson"
                    data-1p-ignore="true"
                />
            </div>

            <div className="input-container">
                <label htmlFor="phone-number">Telefonnummer</label>
                <input
                    id="phone-number"
                    value={info.phoneNumber}
                    onChange={(e) => handleInfoChange("phoneNumber", e.target.value)}
                    className="phone-number-input input-field"
                    type="text"
                    placeholder="Telefonnummer"
                    data-1p-ignore="true"
                />
            </div>

            <div className="input-container">
                <label htmlFor="address">Adresse</label>
                <input
                    id="address"
                    value={info.address}
                    onChange={(e) => handleInfoChange("address", e.target.value)}
                    className="address-input input-field"
                    type="text"
                    placeholder="Adresse"
                    data-1p-ignore="true"
                />
            </div>

            <div className="input-container">
                <label htmlFor="postal-code">Postnummer</label>
                <input
                    id="postal-code"
                    value={info.postalCode}
                    onChange={(e) => handleInfoChange("postalCode", e.target.value)}
                    className="postal-code-input input-field"
                    type="text"
                    placeholder="Postnummer"
                    data-1p-ignore="true"
                />
            </div>

            <div className="input-container">
                <label htmlFor="city">By</label>
                <input
                    id="city"
                    value={info.city}
                    onChange={(e) => handleInfoChange("city", e.target.value)}
                    className="city-input input-field"
                    type="text"
                    placeholder="By"
                    data-1p-ignore="true"
                />
            </div>
        </div>
    );
}

function Step5() {
    const selectedPriceGroups = useArtifactValue(selectedPriceGroupsArtifact);
    const selectedDeliveryMethod = useArtifactValue(selectedDeliveryMethodArtifact);
    const selectedDeliveryDate = useArtifactValue(selectedDeliveryDateArtifact);
    const info = useArtifactValue(infoArtifact);

    const getDeliveryTotal = (totalCards) => {
        if (selectedDeliveryMethod?.price_calc === "fixed") {
            return selectedDeliveryMethod?.price;
        }

        if (selectedDeliveryMethod?.price_calc === "each") {
            return selectedDeliveryMethod?.price * totalCards;
        }

        return 0;
    };

    const rows = selectedPriceGroups.map((priceGroup) => {
        const unitValue = parsePriceFromName(priceGroup.name);
        return {
            id: priceGroup.id,
            name: priceGroup.name,
            quantity: priceGroup.quantity,
            unitValue,
            lineTotal: unitValue * priceGroup.quantity,
        };
    });

    const totalCards = rows.reduce((sum, row) => sum + row.quantity, 0);
    const giftCardSubtotal = rows.reduce((sum, row) => sum + row.lineTotal, 0);
    const total = giftCardSubtotal + getDeliveryTotal(totalCards);

    return (
        <div className="order-summary">
            <h2>Oversigt over din bestilling</h2>

            <table className="summary-table">
                <thead>
                    <tr>
                        <th>Vare</th>
                        <th>Antal</th>
                        <th>Stykpris</th>
                        <th>Pris</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td>Gavekort {row.name}</td>
                            <td>{row.quantity}</td>
                            <td>{formatPrice(row.unitValue)}</td>
                            <td>{formatPrice(row.lineTotal)}</td>
                        </tr>
                    ))}
                    {selectedDeliveryMethod && (
                        <tr>
                            <td>Levering — {selectedDeliveryMethod.name}</td>
                            <td>{totalCards > 0 ? totalCards : "—"}</td>
                            <td>{formatPrice(selectedDeliveryMethod?.price)}</td>
                            <td>{formatPrice(getDeliveryTotal(totalCards))}</td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={3}>Total</td>
                        <td>{formatPrice(total)}</td>
                    </tr>
                </tfoot>
            </table>

            <div className="summary-details">
                <div className="summary-block">
                    <h3>Leveringstidspunkt</h3>
                    {selectedDeliveryDate ? (
                        <dl className="summary-list">
                            <div>
                                <dt>Uge</dt>
                                <dd>{selectedDeliveryDate.week_number}</dd>
                            </div>
                            <div>
                                <dt>Seneste bestilling</dt>
                                <dd>{selectedDeliveryDate.order_date}</dd>
                            </div>
                            <div>
                                <dt>Leveringsdato</dt>
                                <dd>{selectedDeliveryDate.delivery_date}</dd>
                            </div>
                        </dl>
                    ) : (
                        <p>Ikke valgt</p>
                    )}
                </div>

                <div className="summary-block">
                    <h3>Dine oplysninger</h3>
                    <dl className="summary-list">
                        <div>
                            <dt>E-mail</dt>
                            <dd>{info.email || "—"}</dd>
                        </div>
                        <div>
                            <dt>Firmanavn</dt>
                            <dd>{info.companyName || "—"}</dd>
                        </div>
                        <div>
                            <dt>CVR</dt>
                            <dd>{info.cvr || "—"}</dd>
                        </div>
                        <div>
                            <dt>Telefonnummer</dt>
                            <dd>{info.phoneNumber || "—"}</dd>
                        </div>
                        <div>
                            <dt>Adresse</dt>
                            <dd>{info.address || "—"}</dd>
                        </div>
                        <div>
                            <dt>Postnummer</dt>
                            <dd>{info.postalCode || "—"}</dd>
                        </div>
                        <div>
                            <dt>By</dt>
                            <dd>{info.city || "—"}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}

function parsePriceFromName(name) {
    const match = String(name).replace(/\./g, "").match(/\d+/);
    return match ? Number(match[0]) : 0;
}

function formatPrice(value) {
    return `${value.toLocaleString("da-DK")} kr.`;
}
