import { Minus, Plus, Trash2 } from "lucide-react";
import { cx } from "../../utils/format";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
  allowRemove?: boolean;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  label = "Quantity",
  allowRemove = false,
}: QuantityStepperProps) {
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <div className={cx("stepper", `stepper--${size}`)} role="group" aria-label={label}>
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(value - 1)}
        disabled={!canDecrement}
        aria-label={value - 1 < min && allowRemove ? "Remove item" : "Decrease quantity"}
      >
        {value - 1 < min && allowRemove ? (
          <Trash2 size={size === "sm" ? 13 : 15} aria-hidden="true" />
        ) : (
          <Minus size={size === "sm" ? 13 : 15} aria-hidden="true" />
        )}
      </button>
      <input
        className="stepper__value"
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        aria-label={label}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isNaN(next)) return;
          onChange(Math.max(min, Math.min(max, next)));
        }}
      />
      <button
        type="button"
        className="stepper__btn"
        onClick={() => onChange(value + 1)}
        disabled={!canIncrement}
        aria-label="Increase quantity"
      >
        <Plus size={size === "sm" ? 13 : 15} aria-hidden="true" />
      </button>
    </div>
  );
}
