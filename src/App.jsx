import { Suspense, useState } from "react";
import "./assets/styles/fonts.css";
import "./assets/styles/options.css";
import "./assets/styles/steps.css";
import "./assets/styles/delivery-methods.css";
import "./assets/styles/delivery-dates.css";
import "./assets/styles/order-summary.css";
import "./assets/styles/price-groups.css";
import { readArtifact, resetArtifact, useArtifact, useArtifactValue } from "./hooks/artifact";
import {
    currentStepArtifact,
    infoArtifact,
    deliveryDatesArtifact,
    deliveryMethodsArtifact,
    orderObjectArtifact,
    priceGroupsArtifact,
    selectedDeliveryDateArtifact,
    selectedDeliveryMethodArtifact,
    selectedPriceGroupsArtifact,
    steps,
    jgVars,
} from "./data";

function App() {
    const [currentStep, setCurrentStep] = useArtifact(currentStepArtifact);
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const selectedPriceGroups = useArtifactValue(selectedPriceGroupsArtifact);
    const selectedDeliveryMethod = useArtifactValue(selectedDeliveryMethodArtifact);
    const selectedDeliveryDate = useArtifactValue(selectedDeliveryDateArtifact);
    const info = useArtifactValue(infoArtifact);

    const handleOrderClick = () => {
        setIsLoading(true);
        const orderObject = readArtifact(orderObjectArtifact);
        setError(null);
        fetch(`${jgVars.apiBase}/create-stores`, {
            method: "POST",
            body: JSON.stringify(orderObject),
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((data) => {
                        throw new Error(data.message);
                    });
                }
                return response.json();
            })
            .then((data) => {
                console.log("data", data);
                setSubmitted(true);
                setIsLoading(false);
            })
            .finally(() => setIsLoading(false))
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

    const canNavigateToStep = (targetStep) => {
        if (targetStep <= currentStep) {
            return true;
        }
        for (let stepId = currentStep; stepId < targetStep; stepId++) {
            if (!canAdvanceFromStep[stepId]) {
                return false;
            }
        }
        return true;
    };

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
                    <p>Fejl: {error.message}</p>
                    <button onClick={() => setError(null)}>Prøv igen</button>
                </div>
            </div>
        );
    }

    return (
        <div className="wizard-page">
            <h1>Bestil en julegaveshop</h1>

            <div className={`wizard-container wizard-step-${currentStep}`}>
                {currentStep > 1 && (
                    <button
                        className="wizard-close-button"
                        onClick={() => setCurrentStep(1)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-x-icon lucide-x"
                        >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>
                )}
                <div className="wizard">
                    <aside className="step-list">
                        <ol>
                            {steps.map((step) => {
                                const status = currentStep === step.id ? "active" : currentStep > step.id ? "completed" : "upcoming";
                                const isClickable = step.id !== currentStep && canNavigateToStep(step.id);
                                const isDisabled = status === "upcoming" && !isClickable;
                                return (
                                    <li
                                        key={step.id}
                                        className={`step-item ${status} ${isClickable ? "clickable" : ""} ${isDisabled ? "disabled" : ""}`}
                                        onClick={isClickable ? () => setCurrentStep(step.id) : undefined}
                                        aria-disabled={!isClickable}
                                    >
                                        <span className="step-marker">{status === "completed" ? <CheckMark /> : step.id}</span>
                                        <span className="step-label">
                                            <span className="step-kicker">Trin {step.id}</span>
                                            <span className="step-name">{step.name}</span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>
                    </aside>

                    <section className={`step-content step-${currentStep}`}>
                        <Suspense fallback={<p>Indlæser...</p>}>
                            <Step step={steps.find((step) => step.id === currentStep)} />
                        </Suspense>

                        <div className="wizard-nav">
                            {currentStep > 1 && (
                                <button
                                    disabled={currentStep === 1}
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                >
                                    Forrige
                                </button>
                            )}

                            {currentStep < steps.length ? (
                                <button
                                    disabled={!canAdvance}
                                    onClick={() => setCurrentStep(Math.min(currentStep + 1, steps.length))}
                                    className="next-button"
                                >
                                    Næste
                                </button>
                            ) : (
                                <button
                                    className="order-button"
                                    disabled={!canOrder || isLoading}
                                    onClick={() => handleOrderClick()}
                                >
                                    {isLoading ? "Bestiller..." : "Bestil gaveshop"}
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default App;

function Step({ step }) {
    switch (step.id) {
        case 1:
            return <Step1 step={step} />;
        case 2:
            return <Step2 step={step} />;
        case 3:
            return <Step3 step={step} />;
        case 4:
            return <Step4 step={step} />;
        case 5:
            return <Step5 step={step} />;
        default:
            return null;
    }
}

function Step1({ step }) {
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
        setSelectedPriceGroups((prev) => prev.map((pg) => (pg.id === priceGroup.id ? { ...pg, quantity: Math.min(999, Math.max(5, Number(pg.quantity) + delta)) } : pg)));
    };

    const handlePriceGroupQuantityInputChange = (priceGroup, value) => {
        if (Number(value) > 999) {
            value = 999;
        }
        if (Number(value) < 5) {
            return;
        }
        setSelectedPriceGroups((prev) => prev.map((pg) => (pg.id === priceGroup.id ? { ...pg, quantity: Math.max(5, Number(value)) } : pg)));
    };

    return (
        <div>
            <h2>{step.name}</h2>
            <p className="step-description">{step.description}</p>
            <div className="price-groups-options">
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
                            {selected && (
                                <div className="check-mark">
                                    <CheckMark />
                                </div>
                            )}
                            <p className="price-group-option-name">{priceGroup.name}</p>
                            <div className="price-group-option-bottom">
                                {!selected && <button className="select-button">Vælg gaveshop</button>}
                                <div
                                    className="quantity-stepper"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        className="quantity-left"
                                        onClick={() => handlePriceGroupQuantityChange(priceGroup, -1)}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-minus-icon lucide-minus"
                                        >
                                            <path d="M5 12h14" />
                                        </svg>
                                    </button>
                                    <input
                                        className="quantity-stepper-value"
                                        type="number"
                                        min="5"
                                        max="999"
                                        value={selected ? selected.quantity : 5}
                                        onChange={(e) => handlePriceGroupQuantityInputChange(priceGroup, e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="quantity-right"
                                        onClick={() => handlePriceGroupQuantityChange(priceGroup, 1)}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-plus-icon lucide-plus"
                                        >
                                            <path d="M5 12h14" />
                                            <path d="M12 5v14" />
                                        </svg>
                                    </button>
                                </div>
                                <a
                                    className="view-selection-button"
                                    href={priceGroup.url}
                                    target="_blank"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Se udvalg
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Step2({ step }) {
    const deliveryMethods = useArtifactValue(deliveryMethodsArtifact);
    const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useArtifact(selectedDeliveryMethodArtifact);

    return (
        <div>
            <h2>{step.name}</h2>
            <p className="step-description">{step.description}</p>
            <div className="delivery-methods-options">
                {deliveryMethods.map((deliveryMethod) => (
                    <div
                        className={`option ${selectedDeliveryMethod?.id === deliveryMethod.id ? "selected" : ""}`}
                        key={deliveryMethod.id}
                        onClick={() => setSelectedDeliveryMethod(deliveryMethod)}
                    >
                        {selectedDeliveryMethod?.id === deliveryMethod.id && (
                            <div className="check-mark">
                                <CheckMark />
                            </div>
                        )}
                        <div>
                            <p className="delivery-method-name">{deliveryMethod.name}</p>
                            {deliveryMethod.description && <p className="delivery-method-description">{deliveryMethod.description}</p>}
                        </div>
                        <div>{deliveryMethod.price_text && <p className="delivery-method-price">{deliveryMethod.price_text}</p>}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Step3({ step }) {
    const deliverydates = useArtifactValue(deliveryDatesArtifact);
    const [selectedDeliveryDate, setSelectedDeliveryDate] = useArtifact(selectedDeliveryDateArtifact);

    return (
        <div>
            <h2>{step.name}</h2>
            <p className="step-description">{step.description}</p>
            <div className="delivery-dates-options">
                {deliverydates.map((deliverydate) => (
                    <div
                        className={`option ${selectedDeliveryDate?.id === deliverydate.id ? "selected" : ""}`}
                        key={deliverydate.id}
                        onClick={() => setSelectedDeliveryDate(deliverydate)}
                    >
                        {selectedDeliveryDate?.id === deliverydate.id && (
                            <div className="check-mark">
                                <CheckMark />
                            </div>
                        )}
                        <p className="delivery-date-week">Uge: {deliverydate.week_number}</p>
                        <p className="delivery-date-order-date">
                            Seneste bestilling:
                            <span>{deliverydate.order_date}</span>
                        </p>
                        <p className="delivery-date-delivery-date">
                            Leveringsdato:
                            <span>{deliverydate.delivery_date}</span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Step4({ step }) {
    const [info, setInfo] = useArtifact(infoArtifact);

    const handleInfoChange = (key, value) => {
        setInfo((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="input-container-column">
            <h2>{step.name}</h2>
            <p className="step-description">{step.description}</p>

            <div className="input-container-row">
                <div className="input-container required">
                    <label htmlFor="email">E-mail</label>
                    <input
                        id="email"
                        value={info.email}
                        onChange={(e) => handleInfoChange("email", e.target.value)}
                        className="email-input input-field"
                        type="email"
                        data-1p-ignore="true"
                        required
                    />
                </div>
                <div className="input-container required">
                    <label htmlFor="phone-number">Telefonnummer</label>
                    <input
                        id="phone-number"
                        value={info.phoneNumber}
                        onChange={(e) => handleInfoChange("phoneNumber", e.target.value)}
                        className="phone-number-input input-field"
                        type="text"
                        data-1p-ignore="true"
                        required
                    />
                </div>
            </div>

            <div className="input-container-row">
                <div className="input-container required">
                    <label htmlFor="company-name">Firmanavn</label>
                    <input
                        id="company-name"
                        value={info.companyName}
                        onChange={(e) => handleInfoChange("companyName", e.target.value)}
                        className="company-name-input input-field"
                        type="text"
                        data-1p-ignore="true"
                        required
                    />
                </div>
                <div className="input-container required">
                    <label htmlFor="cvr">CVR</label>
                    <input
                        id="cvr"
                        value={info.cvr}
                        onChange={(e) => handleInfoChange("cvr", e.target.value)}
                        className="cvr-input input-field"
                        type="text"
                        data-1p-ignore="true"
                        required
                    />
                </div>
            </div>

            <div className="input-container required">
                <label htmlFor="contact-person">Kontaktperson</label>
                <input
                    id="contact-person"
                    value={info.contactPerson}
                    onChange={(e) => handleInfoChange("contactPerson", e.target.value)}
                    className="contact-person-input input-field"
                    type="text"
                    data-1p-ignore="true"
                    required
                />
            </div>

            <div className="input-container required">
                <label htmlFor="address">Adresse</label>
                <input
                    id="address"
                    value={info.address}
                    onChange={(e) => handleInfoChange("address", e.target.value)}
                    className="address-input input-field"
                    type="text"
                    data-1p-ignore="true"
                    required
                />
            </div>

            <div className="input-container-row">
                <div className="input-container input-container-small required">
                    <label htmlFor="postal-code">Postnummer</label>
                    <input
                        id="postal-code"
                        value={info.postalCode}
                        onChange={(e) => handleInfoChange("postalCode", e.target.value)}
                        className="postal-code-input input-field"
                        type="text"
                        data-1p-ignore="true"
                        required
                    />
                </div>

                <div className="input-container required">
                    <label htmlFor="city">By</label>
                    <input
                        id="city"
                        value={info.city}
                        onChange={(e) => handleInfoChange("city", e.target.value)}
                        className="city-input input-field"
                        type="text"
                        data-1p-ignore="true"
                        required
                    />
                </div>
            </div>
        </div>
    );
}

function Step5({ step }) {
    const selectedPriceGroups = useArtifactValue(selectedPriceGroupsArtifact);
    const selectedDeliveryMethod = useArtifactValue(selectedDeliveryMethodArtifact);
    const selectedDeliveryDate = useArtifactValue(selectedDeliveryDateArtifact);
    const info = useArtifactValue(infoArtifact);

    const getDeliveryTotal = (totalCards) => {
        const deliveryPrice = Number(selectedDeliveryMethod?.price) || 0;

        if (selectedDeliveryMethod?.price_calc === "fixed") {
            return deliveryPrice;
        }

        if (selectedDeliveryMethod?.price_calc === "each") {
            return deliveryPrice * totalCards;
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
            <h2>{step.name}</h2>
            <p className="step-description">{step.description}</p>

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
                            <td>Gavekortlevering — {selectedDeliveryMethod.name}</td>
                            <td>{totalCards > 0 ? totalCards : "—"}</td>
                            <td>{formatPrice(selectedDeliveryMethod?.price)}</td>
                            <td>{formatPrice(getDeliveryTotal(totalCards))}</td>
                        </tr>
                    )}
                    <tr>
                        <td>Pakkelevering</td>
                        <td>-</td>
                        <td>-</td>
                        <td>Se note</td>
                    </tr>
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
                        <>
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
                            <div className="delivery-date-note-container">
                                <p className="delivery-date-note-title">Note:</p>
                                <p className="delivery-date-note">{selectedDeliveryDate.note}</p>
                            </div>
                        </>
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
    return `${Number(value).toLocaleString("da-DK")} kr.`;
}

function CheckMark() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-check-icon lucide-check"
        >
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}
