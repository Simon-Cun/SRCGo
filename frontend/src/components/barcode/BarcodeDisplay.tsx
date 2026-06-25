import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

interface BarcodeDisplayProps {
  value: string;
  isLoading: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
}

const BarcodeDisplay = ({
  value,
  isLoading,
  isHighlighted = false,
  onClick,
}: BarcodeDisplayProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width: 2,
        height: 80,
        displayValue: false,
        margin: 10,
        lineColor: '#000000',
        background: '#ffffff',
      });
    }
  }, [value]);

  if (isLoading && !value) {
    return (
      <div className="py-4">
        <div className="animate-pulse bg-neutral-gray200 rounded h-24 w-full mx-auto" />
        <div className="animate-pulse bg-neutral-gray200 rounded h-3 w-32 mx-auto mt-3" />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={[
        'w-full bg-white rounded-xl p-md text-center cursor-pointer transition-all duration-200',
        'border-3',
        isHighlighted ? 'border-primary-gold shadow-gold-glow' : 'border-transparent',
        onClick ? 'active:opacity-80' : 'cursor-default',
      ].join(' ')}
      aria-label={onClick ? 'Tap to toggle brightness' : undefined}
      type="button"
    >
      <svg ref={svgRef} className="mx-auto max-w-full" />
      {value && (
        <p className="text-center text-xs text-neutral-gray500 mt-sm font-mono tracking-wider">
          {value}
        </p>
      )}
    </button>
  );
};

export default BarcodeDisplay;
