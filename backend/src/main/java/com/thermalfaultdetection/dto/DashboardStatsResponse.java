package com.thermalfaultdetection.dto;

import java.util.List;
import java.util.Map;

public class DashboardStatsResponse {
    private long totalAnalyses;
    private long normalConditions;
    private long faultsDetected;
    private double faultRatePercent;
    private Map<String, Long> faultDistribution;
    private List<AnalysisResponse> recentAnalyses;

    public DashboardStatsResponse() {
    }

    public DashboardStatsResponse(long totalAnalyses, long normalConditions, long faultsDetected, double faultRatePercent, Map<String, Long> faultDistribution, List<AnalysisResponse> recentAnalyses) {
        this.totalAnalyses = totalAnalyses;
        this.normalConditions = normalConditions;
        this.faultsDetected = faultsDetected;
        this.faultRatePercent = faultRatePercent;
        this.faultDistribution = faultDistribution;
        this.recentAnalyses = recentAnalyses;
    }

    public long getTotalAnalyses() {
        return totalAnalyses;
    }

    public void setTotalAnalyses(long totalAnalyses) {
        this.totalAnalyses = totalAnalyses;
    }

    public long getNormalConditions() {
        return normalConditions;
    }

    public void setNormalConditions(long normalConditions) {
        this.normalConditions = normalConditions;
    }

    public long getFaultsDetected() {
        return faultsDetected;
    }

    public void setFaultsDetected(long faultsDetected) {
        this.faultsDetected = faultsDetected;
    }

    public double getFaultRatePercent() {
        return faultRatePercent;
    }

    public void setFaultRatePercent(double faultRatePercent) {
        this.faultRatePercent = faultRatePercent;
    }

    public Map<String, Long> getFaultDistribution() {
        return faultDistribution;
    }

    public void setFaultDistribution(Map<String, Long> faultDistribution) {
        this.faultDistribution = faultDistribution;
    }

    public List<AnalysisResponse> getRecentAnalyses() {
        return recentAnalyses;
    }

    public void setRecentAnalyses(List<AnalysisResponse> recentAnalyses) {
        this.recentAnalyses = recentAnalyses;
    }
}
