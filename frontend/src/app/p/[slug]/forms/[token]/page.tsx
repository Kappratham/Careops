"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, CheckCircle2, FileText, Zap } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface FormField {
  name: string; label: string; type: string;
  required: boolean; options: string[] | null; placeholder: string | null;
}

export default function PublicFormPage() {
  const params = useParams();
  const token = params.token as string;

  const [formData, setFormData] = useState<{
    form_name: string; form_description: string | null;
    fields: FormField[]; booking_date: string | null;
    service_name: string | null; status: string;
  } | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchForm();
  }, []);

  const fetchForm = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/forms/${token}`);
      setFormData(res.data);
      if (res.data.status === "completed") setSubmitted(true);
    } catch {
      toast.error("Form not found or already submitted");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (formData) {
      for (const field of formData.fields) {
        if (field.required && !values[field.name]?.trim()) {
          toast.error(`${field.label} is required`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/public/forms/${token}`, { data: values });
      setSubmitted(true);
      toast.success("Form submitted!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center shadow-lg">
          <CardContent className="py-12">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Form Submitted!</h2>
            <p className="text-muted-foreground">Thank you for completing this form. You&apos;re all set!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center shadow-lg">
          <CardContent className="py-12">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Form Not Found</h2>
            <p className="text-muted-foreground">This form link may be invalid or expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">{formData.form_name}</CardTitle>
            {formData.form_description && (
              <CardDescription>{formData.form_description}</CardDescription>
            )}
            {formData.service_name && (
              <p className="text-sm text-muted-foreground mt-2">
                Service: {formData.service_name} {formData.booking_date && `· ${formData.booking_date}`}
              </p>
            )}
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {formData.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      placeholder={field.placeholder || ""}
                      value={values[field.name] || ""}
                      onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                      required={field.required}
                      rows={3}
                    />
                  ) : (
                    <Input
                      type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                      placeholder={field.placeholder || ""}
                      value={values[field.name] || ""}
                      onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                      required={field.required}
                      className="h-11"
                    />
                  )}
                </div>
              ))}
              <Button type="submit" className="w-full h-11 gradient-primary text-white" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                {submitting ? "Submitting..." : "Submit Form"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}