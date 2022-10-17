/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { IActionContext, UserCancelledError } from '@microsoft/vscode-azext-utils';
import { scheduleRunRequest } from './scheduleRunRequest';
import { KnownRunStatus, Run } from '@azure/arm-containerregistry';

const WAIT_MS = 500;

export async function buildImageInAzure(context: IActionContext, uri?: vscode.Uri | undefined): Promise<Run> {
    if (!vscode.workspace.isTrusted) {
        throw new UserCancelledError('enforceTrust');
    }

    const { runId, node  } = await scheduleRunRequest(context, "DockerBuildRequest", uri);
    const client = await node.getClient(context);

    const getInfo = async () => await client.runs.get(node.resourceGroup, node.registryName, runId);

    // wait for the run to be finished then return
    let info = await getInfo();
    while (info.status === KnownRunStatus.Running) {
        info = await getInfo();
        await sleep(WAIT_MS);
    }

    return info;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));