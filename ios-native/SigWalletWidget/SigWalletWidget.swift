// SigWallet Home Screen, Lock Screen & StandBy Widget
// WidgetKit Extension — add as a new target in Xcode:
//   File → New → Target → Widget Extension
//   Name: SigWalletWidget
//   Include Configuration App Intent: NO
//   Embed in Application: App (SigWallet)
//
// IMPORTANT: In Xcode, add the App Group "group.app.lovable.sigwallet"
// to BOTH the main app target AND this widget extension target.

import WidgetKit
import SwiftUI

// MARK: - Timeline Provider

struct BalanceEntry: TimelineEntry {
    let date: Date
    let balance: String
    let cryptoBalance: String
    let lastTransaction: String
    let lastTxAmount: String
}

struct BalanceProvider: TimelineProvider {
    private let defaults = UserDefaults(suiteName: "group.app.lovable.sigwallet") ?? .standard

    func placeholder(in context: Context) -> BalanceEntry {
        BalanceEntry(date: Date(), balance: "1.234,56 €", cryptoBalance: "$420.00", lastTransaction: "Netflix", lastTxAmount: "-12,99 €")
    }

    func getSnapshot(in context: Context, completion: @escaping (BalanceEntry) -> Void) {
        completion(currentEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BalanceEntry>) -> Void) {
        let entry = currentEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func currentEntry() -> BalanceEntry {
        BalanceEntry(
            date: Date(),
            balance: defaults.string(forKey: "widget_balance") ?? "—",
            cryptoBalance: defaults.string(forKey: "widget_crypto") ?? "",
            lastTransaction: defaults.string(forKey: "widget_last_tx") ?? "",
            lastTxAmount: defaults.string(forKey: "widget_last_tx_amount") ?? ""
        )
    }
}

// MARK: - Shared Colors

private let beigeGradient = LinearGradient(
    colors: [
        Color(hue: 0.17, saturation: 0.56, brightness: 0.91),
        Color(hue: 0.11, saturation: 0.4, brightness: 0.78)
    ],
    startPoint: .topLeading, endPoint: .bottomTrailing
)

private let beigeColor = Color(hue: 0.17, saturation: 0.3, brightness: 0.91)

// MARK: - Widget Views

struct SmallWidgetView: View {
    let entry: BalanceEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("S")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(.black)
                    .frame(width: 24, height: 24)
                    .background(beigeGradient)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                Spacer()
            }

            Spacer()

            Text(entry.balance)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundStyle(.primary)
                .minimumScaleFactor(0.6)

            if !entry.cryptoBalance.isEmpty {
                Text("+ \(entry.cryptoBalance) Crypto")
                    .font(.system(size: 10, weight: .medium))
                    .foregroundStyle(.secondary)
            }

            Text("Aktualisiert \(entry.date, style: .time)")
                .font(.system(size: 7))
                .foregroundStyle(.tertiary)
        }
        .padding(14)
        .containerBackground(.regularMaterial, for: .widget)
    }
}

struct MediumWidgetView: View {
    let entry: BalanceEntry

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("S")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.black)
                        .frame(width: 24, height: 24)
                        .background(beigeGradient)
                        .clipShape(RoundedRectangle(cornerRadius: 6))
                    Text("SigWallet")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text(entry.balance)
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)
                    .minimumScaleFactor(0.5)

                if !entry.cryptoBalance.isEmpty {
                    Text("+ \(entry.cryptoBalance) Crypto")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.secondary)
                }
            }

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                Text("Letzte Transaktion")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)

                if !entry.lastTransaction.isEmpty {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(entry.lastTransaction)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.primary)
                            .lineLimit(1)
                        if !entry.lastTxAmount.isEmpty {
                            Text(entry.lastTxAmount)
                                .font(.system(size: 11, weight: .medium, design: .rounded))
                                .foregroundStyle(entry.lastTxAmount.hasPrefix("-") ? .red : .green)
                        }
                    }
                } else {
                    Text("Keine neuen")
                        .font(.system(size: 12))
                        .foregroundStyle(.tertiary)
                }

                Spacer()

                Text("Aktualisiert \(entry.date, style: .time)")
                    .font(.system(size: 8))
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(14)
        .containerBackground(.regularMaterial, for: .widget)
    }
}

// Lock Screen circular widget
struct LockScreenCircularView: View {
    let entry: BalanceEntry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 1) {
                Text("S")
                    .font(.system(size: 12, weight: .bold))
                Text(entry.balance.replacingOccurrences(of: " €", with: "€"))
                    .font(.system(size: 9, weight: .semibold, design: .rounded))
                    .minimumScaleFactor(0.5)
            }
        }
        .containerBackground(.clear, for: .widget)
    }
}

// Lock Screen inline widget
struct LockScreenInlineView: View {
    let entry: BalanceEntry

    var body: some View {
        Text("💰 \(entry.balance)")
            .containerBackground(.clear, for: .widget)
    }
}

// MARK: - Widget Definitions

struct SigWalletWidget: Widget {
    let kind: String = "SigWalletWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BalanceProvider()) { entry in
            SmallWidgetView(entry: entry)
        }
        .configurationDisplayName("Kontostand")
        .description("Dein aktueller Kontostand auf einen Blick.")
        .supportedFamilies([.systemSmall])
    }
}

struct SigWalletMediumWidget: Widget {
    let kind: String = "SigWalletMediumWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BalanceProvider()) { entry in
            MediumWidgetView(entry: entry)
        }
        .configurationDisplayName("Konto Übersicht")
        .description("Kontostand und letzte Transaktion.")
        .supportedFamilies([.systemMedium])
    }
}

struct SigWalletLockScreenWidget: Widget {
    let kind: String = "SigWalletLockScreen"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BalanceProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                LockScreenCircularView(entry: entry)
            } else {
                LockScreenCircularView(entry: entry)
            }
        }
        .configurationDisplayName("Kontostand")
        .description("Schnellansicht auf dem Sperrbildschirm und StandBy.")
        .supportedFamilies([.accessoryCircular, .accessoryInline])
    }
}

// MARK: - Widget Bundle

@main
struct SigWalletWidgetBundle: WidgetBundle {
    var body: some Widget {
        SigWalletWidget()
        SigWalletMediumWidget()
        SigWalletLockScreenWidget()
    }
}
