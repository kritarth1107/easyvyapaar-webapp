"use client";

export const SAMPLE_INVOICE_DATE = "17/01/2023";
export const SAMPLE_INVOICE_TIME = "02:30 PM";

export function formatInvoiceDateTime(showTime: boolean): string {
  return showTime ? `${SAMPLE_INVOICE_DATE}, ${SAMPLE_INVOICE_TIME}` : SAMPLE_INVOICE_DATE;
}

const TRADE_NAME_BLUE = "#2563eb";

type SignatureVisualProps = {
  businessName: string;
  signatureImageUrl: string | null;
  imageMaxHeight?: number;
  nameFontSize?: number;
};

export function InvoiceSignatureVisual({
  businessName,
  signatureImageUrl,
  imageMaxHeight = 48,
  nameFontSize = 14,
}: SignatureVisualProps) {
  const displayName = businessName.toUpperCase() || "MAYANK ELECTRONICS";

  if (signatureImageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={signatureImageUrl}
        alt="Signature"
        style={{ maxHeight: imageMaxHeight, maxWidth: 160, objectFit: "contain" }}
      />
    );
  }

  return (
    <p
      style={{
        color: TRADE_NAME_BLUE,
        fontWeight: 700,
        fontSize: nameFontSize,
        lineHeight: 1.2,
        textAlign: "center",
      }}
    >
      {displayName}
    </p>
  );
}

type AuthorSignatureProps = SignatureVisualProps & {
  label?: string;
  captionFontSize?: number;
};

export function InvoiceAuthorSignature({
  businessName,
  signatureImageUrl,
  label = "Authorised Signatory For",
  imageMaxHeight = 48,
  nameFontSize = 14,
  captionFontSize = 10,
}: AuthorSignatureProps) {
  const displayName = businessName.toUpperCase() || "MAYANK ELECTRONICS";

  return (
    <div className="text-center">
      <div
        className="flex min-h-[48px] items-center justify-center"
        style={{ minHeight: imageMaxHeight }}
      >
        <InvoiceSignatureVisual
          businessName={businessName}
          signatureImageUrl={signatureImageUrl}
          imageMaxHeight={imageMaxHeight}
          nameFontSize={nameFontSize}
        />
      </div>
      <p style={{ fontSize: captionFontSize, marginTop: 8, fontWeight: 700, lineHeight: 1.35 }}>
        {label}
        <br />
        {displayName}
      </p>
    </div>
  );
}

type ReceiverSignatureProps = {
  enabled: boolean;
  fontSize?: number;
};

export function InvoiceReceiverSignature({ enabled, fontSize = 10 }: ReceiverSignatureProps) {
  if (!enabled) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ fontSize, fontWeight: 700 }}>Receiver&apos;s Signature</p>
      <div
        style={{
          marginTop: 28,
          borderBottom: "1px solid #000",
          minWidth: 140,
          maxWidth: 200,
        }}
      />
    </div>
  );
}
