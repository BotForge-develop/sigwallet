// SigWallet Home Screen & Lock Screen Widget
// WidgetKit Extension — add as a new target in Xcode:
//   File → New → Target → Widget Extension
//   Name: SigWalletWidget
//   Include Configuration App Intent: NO
//   Embed in Application: App (SigWallet)

import WidgetKit
import SwiftUI

// MARK: - Timeline Provider

struct BalanceEntry: TimelineEntry {
    let date: Date
    let balance: String
    let cryptoBalance: String
    let lastTransaction: String
}

struct BalanceProvider: TimelineProvider {
    func placeholder(in context: Context) -> BalanceEntry {
        BalanceEntry(date: Date(), balance: "1.234,56 €", cryptoBalance: "$420.00", lastTransaction: "Netflix -12,99 €")
    }

    func getSnapshot(in context: Context, completion: @escaping (BalanceEntry) -> Void) {
        let entry = BalanceEntry(date: Date(), balance: "1.234,56 €", cryptoBalance: "$420.00", lastTransaction: "Netflix -12,99 €")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BalanceEntry>) -> Void) {
        // Read from UserDefaults (shared App Group)
        let defaults = UserDefaults(suiteName: "group.app.lovable.sigwallet") ?? .standard
        let balance = defaults.string(forKey: "widget_balance") ?? "—"
        let crypto = defaults.string(forKey: "widget_crypto") ?? ""
        let lastTx = defaults.string(forKey: "widget_last_tx") ?? ""

        let entry = BalanceEntry(date: Date(), balance: balance, cryptoBalance: crypto, lastTransaction: lastTx)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

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
                    .background(
                        LinearGradient(colors: [Color(hue: 0.17, saturation: 0.56, brightness: 0.91), Color(hue: 0.11, saturation: 0.4, brightness: 0.78)], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                Spacer()
                Text("SigWallet")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundStyle(.secondary)
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
                        .background(
                            LinearGradient(colors: [Color(hue: 0.17, saturation: 0.56, brightness: 0.91), Color(hue: 0.11, saturation: 0.4, brightness: 0.78)], startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
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
                    Text(entry.lastTransaction)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(2)
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
            LockScreenCircularView(entry: entry)
        }
        .configurationDisplayName("Kontostand")
        .description("Schnellansicht auf dem Sperrbildschirm.")
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
