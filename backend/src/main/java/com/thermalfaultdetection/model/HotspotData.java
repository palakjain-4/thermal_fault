package com.thermalfaultdetection.model;

import java.util.LinkedHashMap;
import java.util.Map;

public class HotspotData {
    private int x;
    private int y;
    private int width;
    private int height;
    private double maxIntensity;
    private double meanIntensity;
    private double areaPixels;
    private double areaRatio;
    private String severityLevel;

    public HotspotData() {
    }

    public HotspotData(int x, int y, int width, int height, double maxIntensity, double meanIntensity, double areaPixels, double areaRatio, String severityLevel) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.maxIntensity = maxIntensity;
        this.meanIntensity = meanIntensity;
        this.areaPixels = areaPixels;
        this.areaRatio = areaRatio;
        this.severityLevel = severityLevel;
    }

    public int getX() {
        return x;
    }

    public void setX(int x) {
        this.x = x;
    }

    public int getY() {
        return y;
    }

    public void setY(int y) {
        this.y = y;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public double getMaxIntensity() {
        return maxIntensity;
    }

    public void setMaxIntensity(double maxIntensity) {
        this.maxIntensity = maxIntensity;
    }

    public double getMeanIntensity() {
        return meanIntensity;
    }

    public void setMeanIntensity(double meanIntensity) {
        this.meanIntensity = meanIntensity;
    }

    public double getAreaPixels() {
        return areaPixels;
    }

    public void setAreaPixels(double areaPixels) {
        this.areaPixels = areaPixels;
    }

    public double getAreaRatio() {
        return areaRatio;
    }

    public void setAreaRatio(double areaRatio) {
        this.areaRatio = areaRatio;
    }

    public String getSeverityLevel() {
        return severityLevel;
    }

    public void setSeverityLevel(String severityLevel) {
        this.severityLevel = severityLevel;
    }

    // Compatibility getters for frontend expectations
    public int[] getPeak_pixel() {
        return new int[]{x + width / 2, y + height / 2};
    }

    public int[] getCentroid() {
        return new int[]{x + width / 2, y + height / 2};
    }

    public double getRelative_contrast() {
        return Math.max(0.12, (maxIntensity - Math.max(10, meanIntensity)) / 255.0);
    }

    public Map<String, Object> getBounding_box() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("x", x);
        map.put("y", y);
        map.put("width", width);
        map.put("height", height);
        return map;
    }
}
