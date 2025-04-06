import { ShelterLine } from "../../../constants/canvasConstants";
import { 
    getStartAndEndPoints,
    getRandomPositionInBounds
} from "../../universalLogic";
import { LifeStage } from "../../../constants/creatureConstants";
import { ObjectType } from "../../../constants/objectConstants";

export default class Shelter {
    constructor(id, position, color, creatureSize) {
        this.id = id;
        this.type = ObjectType.SHELTER;
        this.position = position;
        this.color = color;
        this.size = creatureSize * ShelterLine.MULTIPLIER;

        this.inventory = {
            food: []
        };
        this.totalFoodEnergy = 0;

        this.members = [];
    }

    updateShelter = () => {
        // check that all the members are still part of this shelter
        this.updateMembers();

        // update Food Energy
        this.updateFoodEnergy();
    }

    updateFoodEnergy = () => {
        let total = 0;
        this.inventory.food.forEach(f => {
            total += f.energy;
        });
        this.totalFoodEnergy = total;
    }

    isPositionInsideThisShelter = (position) => {
        let xStart = this.getXStart();
        let yStart = this.getYStart();
        let xEnd = this.getXEnd();
        let yEnd = this.getYEnd();

        if (position.x >= xStart && position.x <= xEnd &&
            position.y >= yStart && position.y <= yEnd) {
                return true;
            }
        return false;
    }

    isInsideShelter = (creature) => {
        let creaturePoints = getStartAndEndPoints(creature.id, creature.position, creature.width, creature.height);
        let xStart = this.getXStart();
        let yStart = this.getYStart();
        let xEnd = this.getXEnd();
        let yEnd = this.getYEnd();

        if (creaturePoints.xStart >= xStart && creaturePoints.xEnd <= xEnd &&
            creaturePoints.yStart >= yStart && creaturePoints.yEnd <= yEnd) {
                return true;
            }
        return false;
    }

    willBeInsideShelter = (creature, newPosition) => {
        let creaturePoints = getStartAndEndPoints(creature.id, newPosition, creature.width, creature.height);
        let xStart = this.getXStart();
        let yStart = this.getYStart();
        let xEnd = this.getXEnd();
        let yEnd = this.getYEnd();

        if ((creaturePoints.xEnd > xStart && creaturePoints.xStart < xEnd) &&
            (creaturePoints.yEnd > yStart && creaturePoints.yStart < yEnd)) {
                return true;
            }
        return false;
    }

    addMemberToShelter = (newMember) => {
        if (!this.isMemberOfShelter(newMember.id)) {
            this.members.push(newMember);
            newMember.safety.shelter = this;
        }
    }

    removeMemberFromShelter = (member) => {
        if (this.isMemberOfShelter(member.id)) {
            let newList = [];
            this.members.forEach(m => {
                if (m.id !== member.id) {
                    newList.push(m);
                }
            });
            this.members = newList;
            member.safety.shelter = null;
        }
    }

    updateMembers = () => {
        let newList = [];
        this.members.forEach(m => {
            if (m.safety.shelter !== null && 
                m.safety.shelter.id === this.id && 
                m.life.lifeStage !== LifeStage.DECEASED) {
                    newList.push(m);
                }
        });
        this.members = newList;
    }

    isMemberOfShelter = (creatureId) => {
        let result = false;
        this.members.forEach(m => {
            if (m.id === creatureId) {
                result = true;
            }
        } );
        return result;
    }

    getCenterPosition = () => {
        return this.position;
    }

    getRandomPositionInsideShelter = (creatureSize) => {
        let padding = creatureSize / 2;
        let result = getRandomPositionInBounds(this.getXStart(), this.getXEnd(), this.getYStart(), this.getYEnd(), padding);
        return result;
    }

    putShelterFoodBackInInventory = (creature) => {
        this.inventory.food.forEach(f => {
            creature.inventory.food.push(f);
        });
        this.inventory.food = [];
    }

    getXStart = () => {
        let halfSize = this.size / 2;
        return this.position.x - halfSize;
    }

    getXEnd = () => {
        let halfSize = this.size / 2;
        return this.position.x + halfSize;
    }

    getYStart = () => {
        let halfSize = this.size / 2;
        return this.position.y - halfSize;
    }

    getYEnd = () => {
        let halfSize = this.size / 2;
        return this.position.y + halfSize;
    }
}