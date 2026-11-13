package com.thermalfaultdetection.model;

public enum FaultSeverity {
    NORMAL("Normal", "#10B981"),
    LOW("Low", "#F59E0B"),
    MEDIUM("Medium", "#F97316"),
    HIGH("High", "#EF4444"),
    CRITICAL("Critical", "#DC2626");

    private final String displayName;
    private final String colorCode;

    FaultSeverity(String displayName, String colorCode) {
        this.displayName = displayName;
        this.colorCode = colorCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getColorCode() {
        return colorCode;
    }
}
