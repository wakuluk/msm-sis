package com.msm.sis.api.patch;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.BeanProperty;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JavaType;
import tools.jackson.databind.ValueDeserializer;

/**
 * Deserializes a PATCH field wrapper while preserving the three states we care about:
 * absent, present with a value, and present with explicit null.
 *
 * The "absent" case is handled by the DTO field default and never reaches this class.
 * Jackson only calls this deserializer when the JSON property is actually present.
 */
public class PatchValueDeserializer extends ValueDeserializer<PatchValue<?>> {

    // Inner type of PatchValue<T>, for example String or LocalDate.
    private final JavaType valueType;
    // Normal Jackson deserializer for the inner value type.
    private final ValueDeserializer<Object> valueDeserializer;

    public PatchValueDeserializer() {
        this(null, null);
    }

    private PatchValueDeserializer(JavaType valueType, ValueDeserializer<Object> valueDeserializer) {
        this.valueType = valueType;
        this.valueDeserializer = valueDeserializer;
    }

    @Override
    public ValueDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property) {
        // PatchValue itself is generic, so we need the concrete field type from the property,
        // such as PatchValue<String> or PatchValue<LocalDate>.
        JavaType wrapperType = property == null ? ctxt.getContextualType() : property.getType();
        JavaType contextualValueType = wrapperType == null
                ? ctxt.constructType(Object.class)
                : wrapperType.containedTypeOrUnknown(0);
        // Ask Jackson how it would normally deserialize the inner value type.
        @SuppressWarnings("unchecked")
        ValueDeserializer<Object> contextualValueDeserializer =
                (ValueDeserializer<Object>) ctxt.findContextualValueDeserializer(contextualValueType, property);
        return new PatchValueDeserializer(contextualValueType, contextualValueDeserializer);
    }

    @Override
    public PatchValue<?> deserialize(JsonParser parser, DeserializationContext ctxt) throws JacksonException {
        Object value;
        if (valueDeserializer != null) {
            // Delegate to Jackson's normal deserializer for the inner type.
            value = valueDeserializer.deserialize(parser, ctxt);
        } else if (valueType != null) {
            value = ctxt.readValue(parser, valueType);
        } else {
            value = ctxt.readValue(parser, Object.class);
        }
        // Reaching this method means the property was present in JSON.
        return PatchValue.of(value);
    }

    @Override
    public PatchValue<?> getNullValue(DeserializationContext ctxt) {
        // Explicit JSON null should still count as "present" so PATCH can clear the field.
        return PatchValue.of(null);
    }
}
