"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";

type PaymentMethod = "manual";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
}: PaymentMethodSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>
          Choose how you want to pay for your subscription
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedMethod}
          onValueChange={(value) => onMethodChange(value as PaymentMethod)}
        >
          <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-accent/50 cursor-pointer">
            <RadioGroupItem value="manual" id="manual" />
            <Label
              htmlFor="manual"
              className="flex flex-1 cursor-pointer items-center gap-3"
            >
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Bank Transfer</div>
                <div className="text-xs text-muted-foreground">
                  Manual review before activation
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
