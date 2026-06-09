import { Suspense } from "react";
import "./assets/styles/fonts.css";
import "./assets/styles/options.css";
import "./assets/styles/steps.css";
import { readArtifact, useArtifact, useArtifactValue } from "./hooks/artifact";
import {
    companyNameArtifact,
    currentStepArtifact,
    deliveryDatesArtifact,
    deliveryMethodsArtifact,
    emailArtifact,
    orderObjectArtifact,
    priceGroupsArtifact,
    selectedDeliveryDateArtifact,
    selectedDeliveryMethodArtifact,
    selectedPriceGroupsArtifact,
    steps,
} from "./data";

function App() {
    const [currentStep, setCurrentStep] = useArtifact(currentStepArtifact);

    const selectedPriceGroups = useArtifactValue(selectedPriceGroupsArtifact);
    const selectedDeliveryMethod = useArtifactValue(selectedDeliveryMethodArtifact);
    const selectedDeliveryDate = useArtifactValue(selectedDeliveryDateArtifact);
    const email = useArtifactValue(emailArtifact);

    const handleOrderClick = () => {
        const orderObject = readArtifact(orderObjectArtifact);
        console.log("orderObject", orderObject);
        fetch("https://julegaveshop6itd.barani.micusto.cloud/wp-json/nkt-dev/v1/create-stores", {
            method: "POST",
            body: JSON.stringify(orderObject),
        })
            .then((response) => response.json())
            .then((data) => console.log("data", data))
            .catch((error) => console.error("error", error));
    };

    const canOrder = selectedPriceGroups.length && selectedDeliveryMethod && selectedDeliveryDate && email;

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
                                    onClick={() => setCurrentStep(step.id)}
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
                            <button onClick={() => setCurrentStep(Math.min(currentStep + 1, steps.length))}>Næste</button>
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
                        <p>{deliveryMethod.name}</p>
                        {deliveryMethod.description && <p>{deliveryMethod.description}</p>}
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
    const [email, setEmail] = useArtifact(emailArtifact);
    const [companyName, setCompanyName] = useArtifact(companyNameArtifact);

    return (
        <div>
            <h2>Angiv din e-mail og firmanavn</h2>
            <div className="input-container">
                <label htmlFor="email">E-mail</label>
                <input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="email-input input-field"
                    type="email"
                    placeholder="E-mail"
                />
            </div>
            <div className="input-container">
                <label htmlFor="company-name">Firmanavn</label>
                <input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="company-name-input input-field"
                    type="text"
                    placeholder="Firmanavn"
                />
            </div>
        </div>
    );
}
