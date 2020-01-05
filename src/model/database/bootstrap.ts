import { Transaction, TransactionDocumentPrototype } from "./Transaction";
import { Driver, DriverDocumentPrototype, DriverDocument } from "./User";
import { ContractInfo, ContractInteractionType } from "../../interfaces/model/Contract";
import { Role } from "../../interfaces/database/IUser";

// MARK: - Users
// MARK: Driver
export const DRIVER_1_ID = "abc12345678";
export const DRIVER_2_ID = "W267095778";

export const DEMO_DRIVER: DriverDocumentPrototype[] = [
    {
        _id: DRIVER_1_ID,
        role: Role.Driver,
    },
    {
        _id: DRIVER_2_ID,
        role: Role.Driver,
    },
];

export async function createDemoDrivers(): Promise<DriverDocument[]> {
    return await Driver.insertMany(DEMO_DRIVER.map(proto => {
        return new Driver(proto as DriverDocumentPrototype);
    }), { ordered: true });
}

// MARK: - Transactions
const TRANSACTION_1_ID = "5dcd227ecd611f0a2211e40a";
const TRANSACTION_2_ID = "5dcd227ecd611f0a2211e40b";
const TRANSACTION_3_ID = "5dcd227ecd611f0a2211e40c";
const TRANSACTION_4_ID = "5dcd227ecd611f0a2211e40d";
const TRANSACTION_5_ID = "5dcd227ecd611f0a2211e40e";
const TRANSACTION_6_ID = "5ddbc9ba29ee6634a2b9c898";
const TRANSACTION_7_ID = "5ddbc9d0425431358b7b9039";

export const DEMO_TRANSACTIONS: TransactionDocumentPrototype[] = [ // any because created at is
    {
        _id: TRANSACTION_1_ID,
        driverID: DRIVER_1_ID,
        date: new Date(),
        value: {
            settled: {
                base: {
                    amount: "0.0015",
                    currency: "ETH"
                },
                exchange: {
                    date: new Date(),
                    rate: 234
                },
                quote: {
                    amount: "3",
                    currency: "EUR"
                }
            },
            current: undefined,
        },
        contractInteraction: {
            contract: {
                address: "",
                networkID: "",
                currency: ""
            },
            // payDriver: {
            //     type: ContractInteractionType.PayDriver,
            //     txHash: "20a8ba45-7db3-41a2-9985-3f982394a961d92",
            //     date: new Date(),
            //     isConfirmed: false
            // }
        },
        receiverAddress: "",
    },
    {
        _id: TRANSACTION_2_ID,
        driverID: DRIVER_1_ID,
        date: new Date(),
        value: {
            settled: {
                base: undefined,
                exchange: undefined,
                quote: {
                    amount: "1.35",
                    currency: "EUR"
                }
            },
            current: undefined,
        },
    },
    {
        _id: TRANSACTION_3_ID,
        driverID: DRIVER_2_ID,
        date: new Date(),
        value: {
            settled: {
                base: undefined,
                exchange: undefined,
                quote: {
                    amount: "0.32",
                    currency: "EUR"
                }
            },
            current: undefined,
        },
    },
    {
        _id: TRANSACTION_4_ID,
        driverID: DRIVER_2_ID,
        date: new Date(),
        value: {
            settled: {
                base: {
                    amount: "0.032",
                    currency: "ETH"
                },
                exchange: {
                    date: new Date(),
                    rate: 234
                },
                quote: {
                    amount: "7",
                    currency: "EUR"
                }
            },
            current: undefined,
        },
        contractInteraction: {
            contract: {
                address: "",
                networkID: "",
                currency: ""
            },
            // payDriver: {
            //     type: ContractInteractionType.PayDriver,
            //     txHash: "20a8ba45-7db3-41a2-9985-3f985a961d92",
            //     isConfirmed: false,
            //     date: new Date(),
            // }
        },
        receiverAddress: "",
    },
    {
        _id: TRANSACTION_5_ID,
        driverID: DRIVER_2_ID,
        date: new Date(),
        value: {
            settled: {
                base: undefined,
                exchange: undefined,
                quote: {
                    amount: "2.6",
                    currency: "EUR"
                }
            },
            current: undefined,
        },
        isPending: false,
    },
    {
        _id: TRANSACTION_6_ID,
        driverID: DRIVER_2_ID,
        date: new Date(),
        value: {
            settled: {
                base: {
                    amount: "0.00001348",
                    currency: "ETH"
                },
                exchange: {
                    date: new Date(),
                    rate: 234
                },
                quote: {
                    amount: "0.23",
                    currency: "EUR"
                }
            },
            current: undefined,
        },
        contractInteraction: {
            contract: {
                address: "",
                networkID: "",
                currency: ""
            },
            // payDriver: {
            //     type: ContractInteractionType.PayDriver,
            //     txHash: "211c6af5-beac-4774-9696-d4021310f61b",
            //     isConfirmed: false,
            //     date: new Date()
            // }
        },
        receiverAddress: "",
    },
    {
        _id: TRANSACTION_7_ID,
        driverID: DRIVER_1_ID,
        date: new Date(),
        value: {
            settled: {
                base: {
                    amount: "0.00000548",
                    currency: "ETH"
                },
                exchange: {
                    date: new Date(),
                    rate: 234
                },
                quote: {
                    amount: "0.1",
                    currency: "EUR"
                }
            },
            current: undefined
        },
        contractInteraction: {
            contract: {
                address: "",
                networkID: "",
                currency: "",
            },
            // payDriver: {
            //     type: ContractInteractionType.PayDriver,
            //     txHash: "211c6af5-beac-4774-9696-d4021310f61b",
            //     isConfirmed: true,
            //     date: new Date(),
            //     confirmationDate: new Date(),
            // }
        },
        receiverAddress: "",
        isPending: false,
    },
];

export async function createDemoTransactions(contract: ContractInfo, addressForDriverID: { [driverID: string]: string }) {
    await Transaction.insertMany(DEMO_TRANSACTIONS.map(proto => {
        let contractInteraction: TransactionDocumentPrototype["contractInteraction"];
        let receiverAddress: TransactionDocumentPrototype["receiverAddress"];

        if (proto.contractInteraction) {
            contractInteraction = {
                contract: contract,
                // payDriver: {
                //     type: proto.contractInteraction.payDriver.type,
                //     txHash: proto.contractInteraction.payDriver.txHash,
                //     isConfirmed: proto.contractInteraction.payDriver.isConfirmed,
                //     confirmationDate: proto.contractInteraction.payDriver.confirmationDate,
                //     date: proto.contractInteraction.payDriver.date
                // }
            };

            receiverAddress = addressForDriverID[proto.driverID];
        }

        return new Transaction({
            _id: proto._id,
            driverID: proto.driverID,
            date: proto.date,
            value: proto.value,
            contractInteraction: contractInteraction,
            isPending: proto.isPending,
            receiverAddress: receiverAddress
        } as TransactionDocumentPrototype);
    }), { ordered: true });   
}